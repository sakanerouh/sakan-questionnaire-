import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json(
      { ok: false, error: "Stripe webhook is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { ok: false, error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const stripe = new Stripe(stripeSecret);
  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const checkout = event.data.object as Stripe.Checkout.Session;
  const reportId = checkout.metadata?.reportId;
  const sessionId = checkout.metadata?.sessionId;

  if (!reportId || !sessionId) {
    return NextResponse.json(
      { ok: false, error: "Checkout session is missing report metadata." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const now = new Date().toISOString();
  const { error: paymentError } = await supabase
    .from("payments")
    .update({
      status: checkout.payment_status === "paid" ? "paid" : checkout.payment_status,
      amount_total: checkout.amount_total,
      currency: checkout.currency,
      updated_at: now,
    })
    .eq("stripe_checkout_session_id", checkout.id);

  if (paymentError) {
    return NextResponse.json(
      { ok: false, error: "Could not update payment." },
      { status: 500 },
    );
  }

  if (checkout.payment_status === "paid") {
    const { error: reportError } = await supabase
      .from("reports")
      .update({
        payment_status: "paid",
        updated_at: now,
      })
      .eq("id", reportId)
      .eq("session_id", sessionId);

    if (reportError) {
      return NextResponse.json(
        { ok: false, error: "Could not unlock report." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}
