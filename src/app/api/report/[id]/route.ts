import { NextResponse } from "next/server";
import { z } from "zod";
import { reportContentSchema } from "@/lib/generatedReport";
import { resultSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { localeSchema } from "@/lib/schemas";

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

export async function GET(
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
  const locale = localeSchema.catch("en").parse(new URL(request.url).searchParams.get("locale") ?? undefined);
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select(
      "id, session_id, result_id, payment_status, content, localized_content, result_locale, content_source, generation_status, generated_at, generation_error",
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

  const { data: resultRow, error: resultError } = await supabase
    .from("archetype_results")
    .select(
      "id, session_id, dominant, secondary, scores, distribution, key_patterns, shadow_themes, dream_sabotage_themes, protection_themes, created_at",
    )
    .eq("id", report.result_id ?? report.id)
    .maybeSingle();

  if (resultError) {
    return NextResponse.json(
      { ok: false, error: "Could not read protective role result." },
      { status: 500 },
    );
  }

  if (!resultRow) {
    return NextResponse.json(
      { ok: false, error: "Report result not found." },
      { status: 404 },
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
  const localizedContent = (report.localized_content && typeof report.localized_content === "object")
    ? report.localized_content as Record<string, unknown>
    : {};
  const requestedContent = localizedContent[locale] ?? (report.result_locale === locale ? report.content : undefined);
  const content = reportContentSchema.safeParse(requestedContent);

  return NextResponse.json({
    ok: true,
    report: {
      id: report.id,
      paymentStatus: report.payment_status,
      contentSource: report.content_source,
      generationStatus: report.generation_status,
      generatedAt: report.generated_at,
      generationError: report.generation_error,
      resultLocale: content.success ? locale : report.result_locale,
      needsGeneration: !content.success,
      result,
      content: content.success ? content.data : null,
    },
  });
}
