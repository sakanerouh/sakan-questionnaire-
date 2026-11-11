import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resultSchema, type SupportedLocale } from "@/lib/schemas";
import { AuditError } from "./http";
import type { AuditAccessState } from "./types";

export const AUDIT_COOKIE = "sakan-audit-access";
export const browserTokenDays = 180;
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("hex");
export const demoEnabled = () => process.env.NODE_ENV === "development" && process.env.ENABLE_DEMO_UNLOCK === "true";

export function auditDatabase() {
  const db = getSupabaseAdmin();
  if (!db) throw new AuditError(503, "Audit access is temporarily unavailable.");
  return db;
}

export function resultFromRow(row: Record<string, unknown>, locale: string) {
  return resultSchema.parse({
    id: row.id, sessionId: row.session_id, dominant: row.dominant, secondary: row.secondary,
    scores: row.scores, distribution: row.distribution, keyPatterns: row.key_patterns,
    shadowThemes: row.shadow_themes, dreamSabotageThemes: row.dream_sabotage_themes,
    protectionThemes: row.protection_themes, completedAt: row.created_at, resultLocale: locale,
  });
}

export async function findAuditSession(sessionId: string) {
  const { data, error } = await auditDatabase().from("anonymous_sessions")
    .select("id, email, locale, payment_flow, questionnaire_version_id").eq("id", sessionId).maybeSingle();
  if (error) throw new AuditError(503, "Audit access is temporarily unavailable.");
  return data;
}

export async function cookieSessionId(request: Request) {
  const token = new NextRequest(request).cookies.get(AUDIT_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const { data, error } = await auditDatabase().from("audit_access_tokens").select("session_id")
    .eq("token_hash", tokenHash(token)).eq("purpose", "browser").gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw new AuditError(503, "Audit access is temporarily unavailable.");
  return data?.session_id as string | null;
}

export function setAuditCookie(response: NextResponse, token: string) {
  response.cookies.set(AUDIT_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: browserTokenDays * 86400 });
}

export async function getAuditGrant(sessionId: string): Promise<"paid" | "demo_unlocked" | null> {
  const { data, error } = await auditDatabase().from("payments").select("status")
    .eq("session_id", sessionId).eq("grants_access", true).order("created_at", { ascending: false });
  if (error) throw new AuditError(503, "Payment confirmation is temporarily unavailable.");
  if (data?.some((p) => p.status === "paid" || p.status === "no_payment_required")) return "paid";
  return demoEnabled() && data?.some((p) => p.status === "demo_unlocked") ? "demo_unlocked" : null;
}

/** Legacy IDs retain their old contract. New sessions require both a credential and payment. */
export async function requireAuditAccess(request: Request, sessionId: string, requirePayment = true) {
  const session = await findAuditSession(sessionId);
  if (!session) throw new AuditError(402, "Please complete checkout before starting your audit.");
  if (session.payment_flow === "post_audit") return { session, paymentStatus: null };
  if (await cookieSessionId(request) !== session.id) throw new AuditError(401, "Open your audit access link or return to checkout.");
  const paymentStatus = await getAuditGrant(sessionId);
  if (requirePayment && !paymentStatus) throw new AuditError(402, "Please complete checkout before starting your audit.");
  return { session, paymentStatus };
}

export async function auditState(sessionId: string, restore = false): Promise<AuditAccessState> {
  const session = await findAuditSession(sessionId);
  if (!session) throw new AuditError(404, "Audit not found.");
  const paymentStatus = await getAuditGrant(sessionId);
  const { data: pending, error } = await auditDatabase().from("payments").select("id")
    .eq("session_id", sessionId).eq("method", "bank_transfer").eq("status", "pending").limit(1);
  if (error) throw new AuditError(503, "Payment confirmation is temporarily unavailable.");
  const state: AuditAccessState = { sessionId, email: session.email ?? "", flow: session.payment_flow,
    granted: session.payment_flow === "post_audit" || !!paymentStatus, paymentStatus, transferPending: !!pending?.length };
  if (restore) {
    const { data: response, error: responseError } = await auditDatabase().from("questionnaire_responses")
      .select("answers, current_screen_id, questionnaire_version_id, completed").eq("session_id", sessionId)
      .order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (responseError) throw new AuditError(503, "Your saved progress could not be restored.");
    state.answers = response?.answers ?? {};
    state.currentScreenId = response?.current_screen_id;
    state.questionnaireVersionId = response?.questionnaire_version_id ?? undefined;
    if (response?.completed) {
      const { data: report, error: reportError } = await auditDatabase().from("reports").select("result_id")
        .eq("session_id", sessionId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (reportError) throw new AuditError(503, "Your saved result could not be restored.");
      if (report?.result_id) {
        const { data: result, error: resultError } = await auditDatabase().from("archetype_results").select("*").eq("id", report.result_id).maybeSingle();
        if (resultError) throw new AuditError(503, "Your saved result could not be restored.");
        if (result) state.result = resultFromRow(result, session.locale);
      }
    }
  }
  return state;
}

export async function initializeAudit(request: Request, previousSessionId: string, locale: SupportedLocale) {
  // A resume link/cookie is authoritative over a stale browser-local session ID.
  const existingCookieSession = await cookieSessionId(request);
  if (existingCookieSession) return { state: await auditState(existingCookieSession, existingCookieSession !== previousSessionId) };
  const previous = await findAuditSession(previousSessionId);
  if (previous?.payment_flow === "post_audit") return { state: await auditState(previous.id) };
  if (previous) throw new AuditError(401, "Your audit access credential is missing. Please use your access link or contact us on WhatsApp.");
  const sessionId = randomUUID();
  const token = newToken();
  const { error } = await auditDatabase().rpc("audit_create_session", {
    p_session_id: sessionId, p_locale: locale, p_token_hash: tokenHash(token),
  });
  if (error) throw new AuditError(503, "Your audit session could not be created. Please try again.");
  return { token, state: { ...await auditState(sessionId), created: true } };
}

export async function requireReportAccess(request: Request, sessionId: string, paymentStatus?: string) {
  if (paymentStatus === "demo_unlocked" && !demoEnabled()) throw new AuditError(402, "Demo access is available only in development.");
  return requireAuditAccess(request, sessionId);
}
