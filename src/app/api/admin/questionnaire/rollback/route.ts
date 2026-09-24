import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { rollbackQuestionnaireVersion } from "@/lib/admin/questionnaire";
import {
  adminRequestMessage,
  adminRequestStatus,
  requireSameOrigin,
} from "@/lib/admin/request";

const bodySchema = z.object({ versionId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin();
    const body = bodySchema.parse(await request.json());
    const publishedId = await rollbackQuestionnaireVersion(admin, body.versionId);
    return NextResponse.json({ ok: true, publishedId });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: adminRequestMessage(error, "Rollback failed.") },
      { status: adminRequestStatus(error) },
    );
  }
}
