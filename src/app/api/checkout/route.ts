import { z } from "zod";
import { localeSchema } from "@/lib/schemas";
import { auditDatabase, demoEnabled, getAuditGrant, requireAuditAccess } from "@/lib/audit/access";
import { AuditError, auditErrorResponse, privateJson, requireAuditOrigin } from "@/lib/audit/http";
import { checkoutStripe, fulfillStripeCheckout, preparePayment } from "@/lib/audit/payments";

const input = z.object({ sessionId: z.string().min(1).max(200), reportId: z.string().min(1).optional(),
  email: z.string().trim().email(), locale: localeSchema.default("en") });

export async function POST(request: Request) {
  try {
    requireAuditOrigin(request);
    const parsed = input.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new AuditError(400, "Enter a valid email address.");
    const { sessionId, reportId, email, locale } = parsed.data;
    let stripe;
    try { stripe = checkoutStripe(); } catch (error) { if (!demoEnabled()) throw error; }
    const db = auditDatabase();
    const { session } = await requireAuditAccess(request, sessionId, false);
    if ((session.payment_flow === "pre_audit" && reportId) || (session.payment_flow === "post_audit" && !reportId)) {
      throw new AuditError(400, "Invalid checkout for this audit.");
    }
    const origin = new URL(request.url).origin;
    const destination = session.payment_flow === "pre_audit" ? `/${locale}/questionnaire/start` : `/${locale}/report/${encodeURIComponent(reportId!)}`;
    if (session.payment_flow === "pre_audit" && await getAuditGrant(sessionId)) return privateJson({ url: `${origin}${destination}`, demo: false });
    if (reportId) {
      const { data: report, error } = await db.from("reports").select("payment_status").eq("id", reportId).eq("session_id", sessionId).maybeSingle();
      if (error || !report) throw new AuditError(400, "Report not found for this audit.");
      if (report.payment_status === "paid" || (demoEnabled() && report.payment_status === "demo_unlocked")) {
        return privateJson({ url: `${origin}${destination}`, demo: false });
      }
    }
    const payment = await preparePayment(sessionId, stripe ? "card" : "demo", email, reportId);
    if (payment.grants_access) return privateJson({ url: `${origin}${destination}`, demo: false });
    if (!stripe) {
      const { error } = await db.from("payments").update({ status: "demo_unlocked", grants_access: true }).eq("id", payment.id);
      if (error) throw new AuditError(503, "Demo access could not be saved.");
      if (reportId) {
        const { error: reportError } = await db.from("reports").update({ payment_status: "demo_unlocked" }).eq("id", reportId).eq("session_id", sessionId);
        if (reportError) throw new AuditError(503, "Demo report could not be unlocked.");
      }
      return privateJson({ url: `${origin}${destination}`, demo: true });
    }
    if (payment.stripe_checkout_session_id) {
      const existing = await stripe.checkout.sessions.retrieve(payment.stripe_checkout_session_id);
      if (existing.status === "open" && existing.url) return privateJson({ url: existing.url, demo: false });
      if (existing.status === "complete") {
        const fulfilled = await fulfillStripeCheckout(stripe, existing.id, sessionId);
        if (fulfilled.granted) return privateJson({ url: `${origin}${destination}`, demo: false });
        throw new AuditError(409, "Your payment is still being confirmed. Please check its status before trying again.");
      }
      const { error } = await db.from("payments").update({ status: "expired" }).eq("id", payment.id).eq("grants_access", false);
      if (error) throw new AuditError(503, "Checkout could not be refreshed.");
      throw new AuditError(409, "Your checkout expired. Please try again to open a new checkout.");
    }
    // Keep parameters stable for this idempotency key even if the client changes language.
    const checkoutLocale = session.locale === "ar" ? "ar" : "en";
    const returnPath = reportId ? `/${checkoutLocale}/report/${encodeURIComponent(reportId)}` : `/${checkoutLocale}/questionnaire/payment`;
    const cancelPath = reportId ? `/${checkoutLocale}/questionnaire/result` : `/${checkoutLocale}/questionnaire/payment`;
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment", payment_method_types: ["card"], allow_promotion_codes: true, customer_email: email,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${origin}${returnPath}?checkout_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}?checkout=cancelled`,
      metadata: { sessionId, paymentId: payment.id, locale: checkoutLocale, ...(reportId ? { reportId } : {}) },
    }, { idempotencyKey: `audit-${payment.id}` });
    const { error } = await db.from("payments").update({ stripe_checkout_session_id: checkout.id, status: "checkout_created" })
      .eq("id", payment.id).eq("grants_access", false);
    if (error || !checkout.url) throw new AuditError(503, "Checkout could not be saved. Please try again.");
    return privateJson({ url: checkout.url, demo: false });
  } catch (error) { return auditErrorResponse(error); }
}
