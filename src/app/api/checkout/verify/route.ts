import { z } from "zod";
import { auditState, requireAuditAccess } from "@/lib/audit/access";
import { AuditError, auditErrorResponse, privateJson, requireAuditOrigin } from "@/lib/audit/http";
import { checkoutStripe, fulfillStripeCheckout } from "@/lib/audit/payments";

export async function POST(request: Request) {
  try {
    requireAuditOrigin(request);
    const input = z.object({ sessionId: z.string().min(1), checkoutId: z.string().regex(/^cs_[A-Za-z0-9_]+$/) })
      .safeParse(await request.json().catch(() => null));
    if (!input.success) throw new AuditError(400, "Invalid payment verification request.");
    await requireAuditAccess(request, input.data.sessionId, false);
    await fulfillStripeCheckout(checkoutStripe(), input.data.checkoutId, input.data.sessionId);
    return privateJson(await auditState(input.data.sessionId));
  } catch (error) { return auditErrorResponse(error); }
}
