import { z } from "zod";
import { auditDatabase } from "@/lib/audit/access";
import { AuditError, auditErrorResponse, privateJson } from "@/lib/audit/http";
import { requireAdmin } from "@/lib/admin/auth";
import { requireSameOrigin, adminRequestStatus, adminRequestMessage } from "@/lib/admin/request";
import { issueAuditLink } from "@/lib/admin/payments";

const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), paymentId: z.string().uuid(), amount: z.number().int().positive().max(100000000),
    currency: z.string().regex(/^[a-z]{3}$/), reference: z.string().trim().min(1).max(200) }),
  z.object({ action: z.literal("link"), sessionId: z.string().min(1).max(200) }),
]);

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin();
    const parsed = input.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new AuditError(400, "Enter the amount received, currency and bank reference.");
    let sessionId: string;
    if (parsed.data.action === "approve") {
      const { paymentId, amount, currency, reference } = parsed.data;
      const { data, error } = await auditDatabase().rpc("audit_approve_transfer", {
        p_payment_id: paymentId, p_actor: admin.userId, p_amount: amount, p_currency: currency, p_reference: reference,
      });
      if (error || !data) throw new AuditError(409, "Transfer approval failed. Check the request and whether the bank reference has already been used.");
      sessionId = data;
    } else { sessionId = parsed.data.sessionId; }
    const url = await issueAuditLink(sessionId, admin, new URL(request.url).origin);
    return privateJson({ ok: true, url });
  } catch (error) {
    if (error instanceof Error && ["ADMIN_UNAUTHORIZED", "ADMIN_INVALID_ORIGIN"].includes(error.message)) {
      return Response.json({ error: adminRequestMessage(error, "Payment request failed.") }, { status: adminRequestStatus(error) });
    }
    return auditErrorResponse(error);
  }
}
