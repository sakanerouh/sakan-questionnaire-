import { NextResponse } from "next/server";
import { generateAiResult } from "@/lib/aiReportGenerator";
import { sessionPayloadSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const databaseErrorMessage = (fallback: string, error: { message?: string; details?: string; code?: string }) =>
  [fallback, error.message, error.details, error.code].filter(Boolean).join(" ");

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
        { ok: false, error: databaseErrorMessage("Could not save questionnaire session.", sessionError) },
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
      { ok: false, error: databaseErrorMessage("Could not save questionnaire response.", responseError) },
      { status: 500 },
    );
  }

  if (payload.completed || payload.result) {
    let result = payload.completed ? undefined : payload.result;

    if (!result) {
      try {
        result = await generateAiResult({
          sessionId: payload.sessionId,
          answers: payload.answers,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI archetype analysis failed.";

        return NextResponse.json(
          { ok: false, error: message },
          { status: 500 },
        );
      }
    }

    const { error: resultError } = await supabase.from("archetype_results").upsert({
      id: result.id,
      session_id: payload.sessionId,
      dominant: result.dominant,
      secondary: result.secondary,
      scores: result.scores,
      distribution: result.distribution,
      key_patterns: result.keyPatterns,
      shadow_themes: result.shadowThemes,
      dream_sabotage_themes: result.dreamSabotageThemes,
      protection_themes: result.protectionThemes,
    });

    if (resultError) {
      return NextResponse.json(
        { ok: false, error: databaseErrorMessage("Could not save archetype result.", resultError) },
        { status: 500 },
      );
    }

    const { error: reportError } = await supabase.from("reports").upsert({
      id: result.id,
      session_id: payload.sessionId,
      result_id: result.id,
      payment_status: "locked",
      content: {},
      content_source: "ai",
      generation_status: "not_started",
      generated_at: null,
      generation_error: null,
      updated_at: now,
    });

    if (reportError) {
      return NextResponse.json(
        { ok: false, error: databaseErrorMessage("Could not save report.", reportError) },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, persisted: true, result });
  }

  return NextResponse.json({ ok: true, persisted: true });
}
