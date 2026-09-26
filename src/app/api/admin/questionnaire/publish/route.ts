import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { publishQuestionnaireDraft } from "@/lib/admin/questionnaire";
import {
  adminRequestMessage,
  adminRequestStatus,
  requireSameOrigin,
} from "@/lib/admin/request";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin();
    const body = (await request.json()) as { changeSummary?: unknown };
    const publishedId = await publishQuestionnaireDraft(
      admin,
      typeof body.changeSummary === "string" ? body.changeSummary : "",
    );
    return NextResponse.json({ ok: true, publishedId });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: adminRequestMessage(error, "Publish failed.") },
      { status: adminRequestStatus(error) },
    );
  }
}
