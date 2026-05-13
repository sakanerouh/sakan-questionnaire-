import { NextResponse } from "next/server";
import { buildReportBlocks } from "@/lib/report";
import { sessionPayloadSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const parsed = sessionPayloadSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid questionnaire payload." },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ ok: true, persisted: false });
  }
  const now = new Date().toISOString();

  const { error: sessionError } = await supabase.from("anonymous_sessions").upsert({
    id: payload.sessionId,
    email: payload.email || null,
    updated_at: now,
  });

  if (sessionError) {
    return NextResponse.json(
      { ok: false, error: "Could not save questionnaire session." },
      { status: 500 },
    );
  }

  const { data: existingResponse, error: responseLookupError } = await supabase
    .from("questionnaire_responses")
    .select("id, completed")
    .eq("session_id", payload.sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (responseLookupError) {
    return NextResponse.json(
      { ok: false, error: "Could not read questionnaire response." },
      { status: 500 },
    );
  }

  const responseValues = {
    session_id: payload.sessionId,
    answers: payload.answers,
    completed: payload.completed || existingResponse?.completed || false,
    updated_at: now,
  };

  const responseWrite = existingResponse
    ? supabase
        .from("questionnaire_responses")
        .update(responseValues)
        .eq("id", existingResponse.id)
    : supabase.from("questionnaire_responses").insert(responseValues);

  const { error: responseError } = await responseWrite;

  if (responseError) {
    return NextResponse.json(
      { ok: false, error: "Could not save questionnaire response." },
      { status: 500 },
    );
  }

  if (payload.result) {
    const reportContent = buildReportBlocks(payload.answers, payload.result);

    const { error: resultError } = await supabase.from("archetype_results").upsert({
      id: payload.result.id,
      session_id: payload.sessionId,
      dominant: payload.result.dominant,
      secondary: payload.result.secondary,
      scores: payload.result.scores,
      distribution: payload.result.distribution,
      key_patterns: payload.result.keyPatterns,
      shadow_themes: payload.result.shadowThemes,
      dream_sabotage_themes: payload.result.dreamSabotageThemes,
      protection_themes: payload.result.protectionThemes,
    });

    if (resultError) {
      return NextResponse.json(
        { ok: false, error: "Could not save archetype result." },
        { status: 500 },
      );
    }

    const { error: reportError } = await supabase.from("reports").upsert({
      id: payload.result.id,
      session_id: payload.sessionId,
      result_id: payload.result.id,
      payment_status: "locked",
      content: reportContent,
      updated_at: now,
    });

    if (reportError) {
      return NextResponse.json(
        { ok: false, error: "Could not save report." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, persisted: true });
}
