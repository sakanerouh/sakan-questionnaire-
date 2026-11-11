import Stripe from "stripe";
import { fulfillStripeCheckout } from "@/lib/audit/payments";
import { auditErrorResponse, privateJson } from "@/lib/audit/http";

export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !secret || (process.env.NODE_ENV === "production" && /^(sk|rk)_test_/.test(key))) return Response.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  const stripe = new Stripe(key);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") ?? "", secret);
  } catch { return Response.json({ error: "Invalid Stripe signature." }, { status: 400 }); }
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) return privateJson({ ok: true, ignored: true });
  try {
    await fulfillStripeCheckout(stripe, (event.data.object as Stripe.Checkout.Session).id);
    return privateJson({ ok: true });
  } catch (error) { return auditErrorResponse(error); }
}
