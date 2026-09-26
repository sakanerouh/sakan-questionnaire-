import { NextResponse } from "next/server";
import { z } from "zod";
import { getQuestionnaireSnapshotForSession } from "@/lib/questionnaireRepository";
import { localeSchema } from "@/lib/schemas";

const querySchema = z.object({
  sessionId: z.string().min(1),
  locale: localeSchema.catch("en"),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    sessionId: url.searchParams.get("sessionId"),
    locale: url.searchParams.get("locale"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid questionnaire request." }, { status: 400 });
  }

  const snapshot = await getQuestionnaireSnapshotForSession(
    parsed.data.sessionId,
    parsed.data.locale,
  );
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
