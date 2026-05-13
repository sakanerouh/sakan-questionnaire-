import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const checkoutSchema = z.object({
  sessionId: z.string().min(1),
  reportId: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout payload." },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (supabase) {
    const { error: sessionError } = await supabase.from("anonymous_sessions").upsert({
      id: payload.sessionId,
      email: payload.email || null,
      updated_at: now,
    });

    if (sessionError) {
      return NextResponse.json(
        { error: "Could not prepare checkout session." },
        { status: 500 },
      );
    }
  }

  if (!stripeSecret || !priceId) {
    if (supabase) {
      const { error: paymentError } = await supabase.from("payments").insert({
        session_id: payload.sessionId,
        status: "demo_unlocked",
        stripe_checkout_session_id: null,
      });

      if (paymentError) {
        return NextResponse.json(
          { error: "Could not save demo payment." },
          { status: 500 },
        );
      }

      const { error: reportError } = await supabase
        .from("reports")
        .update({ payment_status: "demo_unlocked", updated_at: now })
        .eq("id", payload.reportId);

      if (reportError) {
        return NextResponse.json(
          { error: "Could not unlock report." },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      url: `${origin}/report/${payload.reportId}?demo_unlocked=1`,
      demo: true,
    });
  }

  const stripe = new Stripe(stripeSecret);

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: payload.email || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/report/${payload.reportId}?checkout=success`,
    cancel_url: `${origin}/questionnaire/result?checkout=cancelled`,
    metadata: {
      sessionId: payload.sessionId,
      reportId: payload.reportId,
    },
  });

  if (supabase) {
    const { error: paymentError } = await supabase.from("payments").insert({
      session_id: payload.sessionId,
      stripe_checkout_session_id: checkout.id,
      status: "checkout_created",
      amount_total: checkout.amount_total,
      currency: checkout.currency,
    });

    if (paymentError) {
      return NextResponse.json(
        { error: "Checkout was created, but payment could not be saved." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ url: checkout.url, demo: false });
}
