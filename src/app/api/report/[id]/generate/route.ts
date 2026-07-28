import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAiReport } from "@/lib/aiReportGenerator";
import { generatedReportSchema } from "@/lib/generatedReport";
import { answersSchema, localeSchema, resultSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { migrateLegacyAnswers } from "@/lib/questionnaireMigration";

const unlockedStatuses = new Set(["paid", "demo_unlocked"]);

export const maxDuration = 300;

const resultRowSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  dominant: z.enum(["anticipator", "performer", "harmonizer", "quiter"]),
  secondary: z.enum(["anticipator", "performer", "harmonizer", "quiter"]),
  scores: z.record(z.string(), z.number()),
  distribution: z.record(z.string(), z.number()),
  key_patterns: z.array(z.string()).default([]),
  shadow_themes: z.array(z.string()).default([]),
  dream_sabotage_themes: z.array(z.string()).default([]),
  protection_themes: z.array(z.string()).default([]),
  created_at: z.string(),
});

const answerRowSchema = z.object({
  answers: answersSchema,
});

const toClientError = (error: unknown) =>
  error instanceof Error ? error.message : "Report generation failed.";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const requestBody = await request.json().catch(() => ({}));
  const locale = localeSchema.catch("en").parse((requestBody as { locale?: unknown }).locale);
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select(
      "id, session_id, result_id, payment_status, content, localized_content, result_locale, content_source, generation_status",
    )
    .eq("id", id)
    .maybeSingle();

  if (reportError) {
    return NextResponse.json(
      { ok: false, error: "Could not read report." },
      { status: 500 },
    );
  }

  if (!report) {
    return NextResponse.json(
      { ok: false, error: "Report not found." },
      { status: 404 },
    );
  }

  if (!unlockedStatuses.has(report.payment_status)) {
    return NextResponse.json(
      { ok: false, error: "Report is locked." },
      { status: 402 },
    );
  }

  const localizedContent = (report.localized_content && typeof report.localized_content === "object")
    ? report.localized_content as Record<string, unknown>
    : {};
  const cachedContent = localizedContent[locale] ?? (report.result_locale === locale ? report.content : undefined);

  if (report.content_source === "ai" && report.generation_status === "ready") {
    const parsed = generatedReportSchema.safeParse(cachedContent);

    if (parsed.success) {
      return NextResponse.json({ ok: true, content: parsed.data });
    }
  }

  const now = new Date().toISOString();
  const { error: statusError } = await supabase
    .from("reports")
    .update({
      generation_status: "generating",
      generation_error: null,
      updated_at: now,
    })
    .eq("id", report.id);

  if (statusError) {
    return NextResponse.json(
      { ok: false, error: "Could not prepare report generation." },
      { status: 500 },
    );
  }

  const { data: resultRow, error: resultError } = await supabase
    .from("archetype_results")
    .select(
      "id, session_id, dominant, secondary, scores, distribution, key_patterns, shadow_themes, dream_sabotage_themes, protection_themes, created_at",
    )
    .eq("id", report.result_id ?? report.id)
    .maybeSingle();

  if (resultError || !resultRow) {
    return NextResponse.json(
      { ok: false, error: "Could not read protective role result." },
      { status: resultError ? 500 : 404 },
    );
  }

  const { data: answerRow, error: answerError } = await supabase
    .from("questionnaire_responses")
    .select("answers")
    .eq("session_id", report.session_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (answerError || !answerRow) {
    return NextResponse.json(
      { ok: false, error: "Could not read questionnaire answers." },
      { status: answerError ? 500 : 404 },
    );
  }

  const resultData = resultRowSchema.parse(resultRow);
  const result = resultSchema.parse({
    id: resultData.id,
    sessionId: resultData.session_id,
    dominant: resultData.dominant,
    secondary: resultData.secondary,
    scores: resultData.scores,
    distribution: resultData.distribution,
    keyPatterns: resultData.key_patterns,
    shadowThemes: resultData.shadow_themes,
    dreamSabotageThemes: resultData.dream_sabotage_themes,
    protectionThemes: resultData.protection_themes,
    completedAt: resultData.created_at,
    resultLocale: locale,
  });
  const answers = migrateLegacyAnswers(answerRowSchema.parse(answerRow).answers);

  try {
    const content = await generateAiReport({ answers, result, locale });
    const generatedAt = new Date().toISOString();

    const primaryContent = generatedReportSchema.safeParse(report.content).success;
    const { error: saveError } = await supabase
      .from("reports")
      .update({
        content: primaryContent ? report.content : content,
        result_locale: primaryContent ? report.result_locale : locale,
        localized_content: { ...localizedContent, [locale]: content },
        content_source: "ai",
        generation_status: "ready",
        generated_at: generatedAt,
        generation_error: null,
        updated_at: generatedAt,
      })
      .eq("id", report.id);

    if (saveError) {
      throw new Error("Generated report could not be saved.");
    }

    return NextResponse.json({ ok: true, content });
  } catch (error) {
    const message = toClientError(error).slice(0, 900);
    const failedAt = new Date().toISOString();

    await supabase
      .from("reports")
      .update({
        generation_status: "failed",
        generation_error: message,
        updated_at: failedAt,
      })
      .eq("id", report.id);

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
