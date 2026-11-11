import "server-only";
import Stripe from "stripe";
import { auditDatabase, findAuditSession } from "./access";
import { AuditError } from "./http";
import type { AuditPrice } from "./types";
import { checkoutGrantsReportAccess } from "@/lib/stripe/checkoutAccess";

export function checkoutStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !process.env.STRIPE_PRICE_ID || (process.env.NODE_ENV === "production" &&
    (!process.env.STRIPE_WEBHOOK_SECRET || /^(sk|rk)_test_/.test(key)))) {
    throw new AuditError(503, "Payment is temporarily unavailable.");
  }
  return new Stripe(key, { timeout: 15000, maxNetworkRetries: 1 });
}

export async function getAuditPrice(): Promise<AuditPrice> {
  try {
    const price = await checkoutStripe().prices.retrieve(process.env.STRIPE_PRICE_ID!);
    if (!price.active || price.type !== "one_time" || price.unit_amount === null || price.unit_amount <= 0) return null;
    const digits = new Intl.NumberFormat("en", { style: "currency", currency: price.currency }).resolvedOptions().maximumFractionDigits ?? 2;
    return { amount: price.unit_amount / 10 ** digits, currency: price.currency };
  } catch { return null; }
}

export async function preparePayment(sessionId: string, method: "card" | "bank_transfer" | "demo", email: string, reportId?: string) {
  const { data, error } = await auditDatabase().rpc("audit_prepare_payment", {
    p_session_id: sessionId, p_method: method, p_email: email, p_report_id: reportId ?? null,
    p_price_id: method === "card" ? process.env.STRIPE_PRICE_ID ?? null : null,
  });
  if (error || !data) throw new AuditError(503, "Your payment request could not be saved. Please try again.");
  return data as { id: string; session_id: string; stripe_checkout_session_id: string | null; status: string; grants_access: boolean };
}

/** Always retrieve from Stripe; the browser supplies an identifier, never payment status. */
export async function fulfillStripeCheckout(stripe: Stripe, checkoutId: string, expectedSessionId?: string) {
  const checkout = await stripe.checkout.sessions.retrieve(checkoutId, { expand: ["line_items"] });
  const sessionId = checkout.metadata?.sessionId;
  const reportId = checkout.metadata?.reportId || null;
  const paymentId = checkout.metadata?.paymentId || null;
  if (!sessionId || (expectedSessionId && sessionId !== expectedSessionId) || checkout.mode !== "payment") {
    throw new AuditError(400, "This payment does not belong to your audit.");
  }
  const session = await findAuditSession(sessionId);
  if (!session || (session.payment_flow === "pre_audit" && (!paymentId || reportId)) ||
    (session.payment_flow === "post_audit" && !reportId)) throw new AuditError(400, "Invalid payment metadata.");
  const db = auditDatabase();
  const lookup = db.from("payments").select("id, session_id, report_id, price_id, method, stripe_checkout_session_id");
  const { data: payment, error } = await (paymentId ? lookup.eq("id", paymentId) : lookup.eq("stripe_checkout_session_id", checkout.id)).maybeSingle();
  if (error) throw new AuditError(503, "Payment confirmation is temporarily unavailable.");
  if ((paymentId && !payment) || (payment && (payment.session_id !== sessionId || payment.method !== "card" ||
    (payment.report_id && payment.report_id !== reportId) ||
    (payment.stripe_checkout_session_id && payment.stripe_checkout_session_id !== checkout.id)))) {
    throw new AuditError(400, "Payment record mismatch.");
  }
  if (reportId) {
    const { data: report, error: reportError } = await db.from("reports").select("id").eq("id", reportId).eq("session_id", sessionId).maybeSingle();
    if (reportError || !report) throw new AuditError(400, "Payment report mismatch.");
  }
  const expectedPrice = payment?.price_id ?? process.env.STRIPE_PRICE_ID;
  const items = checkout.line_items?.data ?? [];
  if (items.length !== 1 || items[0].quantity !== 1 || items[0].price?.id !== expectedPrice || checkout.line_items?.has_more) {
    throw new AuditError(400, "Payment product mismatch.");
  }
  const grants = checkout.status === "complete" && checkoutGrantsReportAccess(checkout);
  const { error: fulfillmentError } = await db.rpc("audit_fulfill_card", {
    p_payment_id: paymentId, p_session_id: sessionId, p_checkout_id: checkout.id, p_report_id: reportId,
    p_status: checkout.payment_status, p_grants: grants, p_amount: checkout.amount_total, p_currency: checkout.currency,
  });
  if (fulfillmentError) throw new AuditError(503, "Your payment could not be confirmed yet. Please try again.");
  return { sessionId, reportId, granted: grants };
}
