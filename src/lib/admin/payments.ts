import "server-only";
import { auditDatabase, newToken, tokenHash } from "@/lib/audit/access";
import { AuditError } from "@/lib/audit/http";
import { requireAdmin, type CurrentAdmin } from "./auth";

export async function getAdminPayments() {
  await requireAdmin();
  const { data, error } = await auditDatabase().from("payments")
    .select("id, session_id, email, method, status, amount_total, currency, approved_at, transfer_reference, created_at, anonymous_sessions(locale)")
    .order("created_at", { ascending: false }).limit(500);
  if (error) throw new AuditError(503, "Payments could not be loaded.");
  return data ?? [];
}

export async function issueAuditLink(sessionId: string, admin: CurrentAdmin, origin: string) {
  const token = newToken();
  const db = auditDatabase();
  const { data: session, error: sessionError } = await db.from("anonymous_sessions").select("locale").eq("id", sessionId).single();
  if (sessionError) throw new AuditError(404, "Audit not found.");
  const { error } = await db.rpc("audit_issue_resume", { p_session_id: sessionId, p_actor: admin.userId, p_token_hash: tokenHash(token) });
  if (error) throw new AuditError(503, "The access link could not be issued. Verify that payment has been confirmed, then try again.");
  const locale = session.locale === "ar" ? "ar" : "en";
  return `${origin}/${locale}/questionnaire/resume#token=${token}`;
}
