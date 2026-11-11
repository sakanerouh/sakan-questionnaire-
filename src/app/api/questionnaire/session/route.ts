import { NextResponse } from "next/server";
import { generateAiResult } from "@/lib/aiReportGenerator";
import { sessionPayloadSchema } from "@/lib/schemas";
import { databaseErrorMessage } from "@/lib/supabase/errors";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { migrateLegacyAnswers } from "@/lib/questionnaireMigration";
import { getQuestionnaireSnapshotForSession } from "@/lib/questionnaireRepository";
import { requireAuditAccess, resultFromRow } from "@/lib/audit/access";
import { auditErrorResponse, requireAuditOrigin } from "@/lib/audit/http";

export async function POST(request: Request) {
  const parsed = sessionPayloadSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid questionnaire payload." },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  let access;
  try {
    requireAuditOrigin(request);
    access = await requireAuditAccess(request, payload.sessionId);
  } catch (error) { return auditErrorResponse(error); }
  const answers = migrateLegacyAnswers(payload.answers);
  const supabase = getSupabaseAdmin();
  const snapshot = await getQuestionnaireSnapshotForSession(payload.sessionId, payload.locale);

  if (!supabase) return NextResponse.json({ ok: false, error: "Audit storage is temporarily unavailable." }, { status: 503 });
  const now = new Date().toISOString();

  const { error: sessionError } = await supabase.from("anonymous_sessions").upsert({
    id: payload.sessionId,
    email: payload.email || access.session.email || null,
    locale: payload.locale,
    questionnaire_version_id: snapshot.id,
    updated_at: now,
  });

  if (sessionError) {
    return NextResponse.json(
      { ok: false, error: databaseErrorMessage("Could not save questionnaire session.", sessionError) },
      { status: 500 },
    );
  }

  const { data: existingResponse, error: responseLookupError } = await supabase
    .from("questionnaire_responses")
    .select("id, completed, answers")
    .eq("session_id", payload.sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (responseLookupError) {
    return NextResponse.json(
      {
        ok: false,
        error: databaseErrorMessage(
          "Could not read questionnaire response.",
          responseLookupError,
        ),
      },
      { status: 500 },
    );
  }

  // Completion is committed atomically with its result/report. Autosaves cannot
  // mutate the answers underlying an already completed report.
  if (payload.completed || payload.result) {
    if (existingResponse?.completed) {
      const { data: savedReports, error: savedError } = await supabase.from("reports").select("result_id")
        .eq("session_id", payload.sessionId).order("created_at", { ascending: false }).limit(1);
      const canonical = (value: Record<string, unknown>) => JSON.stringify(Object.keys(value).sort().map((key) => [key, value[key]]));
      if (!savedError && savedReports?.[0]?.result_id && canonical(existingResponse.answers) === canonical(answers)) {
        const { data: savedResult, error } = await supabase.from("archetype_results").select("*").eq("id", savedReports[0].result_id).maybeSingle();
        if (!error && savedResult) return NextResponse.json({ ok: true, persisted: true, result: resultFromRow(savedResult, payload.locale) });
      }
    }
    try {
      const result = await generateAiResult({ sessionId: payload.sessionId, answers, locale: payload.locale, snapshot });
      const { data: savedResult, error } = await supabase.rpc("audit_save_completion", {
        p_session_id: payload.sessionId, p_answers: answers, p_locale: payload.locale,
        p_version: snapshot.id, p_screen: payload.currentScreenId ?? null, p_result: result,
        p_demo: access.paymentStatus === "demo_unlocked",
      });
      if (error || !savedResult) return NextResponse.json({ ok: false, error: "Your result could not be saved. Please try again." }, { status: 503 });
      return NextResponse.json({ ok: true, persisted: true, result: resultFromRow(savedResult, payload.locale) });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Audit analysis failed. Please try again." }, { status: 500 });
    }
  }
  if (existingResponse?.completed) return NextResponse.json({ ok: true, persisted: true });

  const { error: responseError } = await supabase.rpc("audit_save_progress", {
    p_session_id: payload.sessionId, p_answers: answers, p_locale: payload.locale,
    p_version: snapshot.id, p_screen: payload.currentScreenId ?? null,
  });

  if (responseError) {
    return NextResponse.json(
      { ok: false, error: databaseErrorMessage("Could not save questionnaire response.", responseError) },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, persisted: true });
}
