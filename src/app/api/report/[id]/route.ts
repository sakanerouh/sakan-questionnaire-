import { NextResponse } from "next/server";
import { z } from "zod";
import { resultSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const reportBlockSchema = z.object({
  title: z.string(),
  body: z.string(),
  bullets: z.array(z.string()).optional(),
});

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
  _request: Request,
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
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id, session_id, result_id, payment_status, content")
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
      { ok: false, error: "Could not read archetype result." },
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
  });

  return NextResponse.json({
    ok: true,
    report: {
      id: report.id,
      paymentStatus: report.payment_status,
      result,
      blocks: z.array(reportBlockSchema).parse(report.content),
    },
  });
}
