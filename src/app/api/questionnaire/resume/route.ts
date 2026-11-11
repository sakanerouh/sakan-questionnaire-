import { z } from "zod";
import { auditDatabase, auditState, newToken, setAuditCookie, tokenHash } from "@/lib/audit/access";
import { AuditError, auditErrorResponse, privateJson, requireAuditOrigin } from "@/lib/audit/http";

export async function POST(request: Request) {
  try {
    requireAuditOrigin(request);
    const parsed = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new AuditError(400, "This access link is invalid.");
    const token = newToken();
    const { data: sessionId, error } = await auditDatabase().rpc("audit_redeem_resume", {
      p_token_hash: tokenHash(parsed.data.token), p_browser_hash: tokenHash(token),
    });
    if (error || !sessionId) throw new AuditError(410, "This access link has expired or has already been used. Please request a new link on WhatsApp.");
    // Once redeemed, retain the new credential even if progress restoration has
    // a transient failure; retry can then restore through the normal access API.
    try {
      const response = privateJson(await auditState(sessionId, true));
      setAuditCookie(response, token);
      return response;
    } catch (error) {
      const response = auditErrorResponse(error);
      setAuditCookie(response, token);
      return response;
    }
  } catch (error) { return auditErrorResponse(error); }
}
