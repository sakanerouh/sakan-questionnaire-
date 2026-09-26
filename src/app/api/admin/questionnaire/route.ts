import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminQuestionnaireState, saveQuestionnaireDraft } from "@/lib/admin/questionnaire";
import {
  adminRequestMessage,
  adminRequestStatus,
  requireSameOrigin,
} from "@/lib/admin/request";

const errorResponse = (error: unknown) => {
  return NextResponse.json(
    { ok: false, error: adminRequestMessage(error, "Admin request failed.") },
    { status: adminRequestStatus(error) },
  );
};

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(
      { ok: true, ...(await getAdminQuestionnaireState()) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin();
    const body = (await request.json()) as { payload?: unknown };
    const draft = await saveQuestionnaireDraft(admin, body.payload);
    return NextResponse.json({ ok: true, draft });
  } catch (error) {
    return errorResponse(error);
  }
}
