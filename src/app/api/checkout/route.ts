import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import {
  databaseErrorMessage,
  isSupabaseUnavailable,
  supabaseUnavailableMessage,
} from "@/lib/supabase/errors";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { localeSchema } from "@/lib/schemas";

const checkoutSchema = z.object({
  sessionId: z.string().min(1),
  reportId: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  locale: localeSchema.catch("en").default("en"),
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const isProduction = process.env.NODE_ENV === "production";
  const demoUnlockEnabled =
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_DEMO_UNLOCK === "true";
  const isCheckoutConfigurationMissing =
    !stripeSecret || !priceId || (isProduction && !webhookSecret);
  const isTestKeyInProduction =
    isProduction && stripeSecret?.startsWith("sk_test_");

  if (
    isTestKeyInProduction ||
    (isCheckoutConfigurationMissing && !demoUnlockEnabled)
  ) {
    return NextResponse.json(
      { error: "Payment is temporarily unavailable." },
      { status: 503 },
    );
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (supabase) {
    const { error: sessionError } = await supabase.from("anonymous_sessions").upsert({
      id: payload.sessionId,
      email: payload.email || null,
      locale: payload.locale,
      updated_at: now,
    });

    if (sessionError) {
      const error = isSupabaseUnavailable(sessionError)
        ? supabaseUnavailableMessage
        : databaseErrorMessage("Could not prepare checkout session.", sessionError);

      return NextResponse.json(
        { error },
        { status: 500 },
      );
    }
  }

  if (isCheckoutConfigurationMissing) {
    if (supabase) {
      const { error: paymentError } = await supabase.from("payments").insert({
        session_id: payload.sessionId,
        status: "demo_unlocked",
        stripe_checkout_session_id: null,
      });

      if (paymentError) {
        const error = isSupabaseUnavailable(paymentError)
          ? supabaseUnavailableMessage
          : databaseErrorMessage("Could not save demo payment.", paymentError);

        return NextResponse.json(
          { error },
          { status: 500 },
        );
      }

      const { error: reportError } = await supabase
        .from("reports")
        .update({ payment_status: "demo_unlocked", updated_at: now })
        .eq("id", payload.reportId);

      if (reportError) {
        const error = isSupabaseUnavailable(reportError)
          ? supabaseUnavailableMessage
          : databaseErrorMessage("Could not unlock report.", reportError);

        return NextResponse.json(
          { error },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      url: `${origin}/${payload.locale}/report/${payload.reportId}?demo_unlocked=1`,
      demo: true,
    });
  }

  const stripe = new Stripe(stripeSecret);

  let checkout: Stripe.Checkout.Session;

  try {
    checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true,
      customer_email: payload.email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/${payload.locale}/report/${payload.reportId}?checkout=success`,
      cancel_url: `${origin}/${payload.locale}/questionnaire/result?checkout=cancelled`,
      metadata: {
        sessionId: payload.sessionId,
        reportId: payload.reportId,
        locale: payload.locale,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Stripe checkout could not be created. Check STRIPE_SECRET_KEY and STRIPE_PRICE_ID in production.",
      },
      { status: 500 },
    );
  }

  if (supabase) {
    const { error: paymentError } = await supabase.from("payments").insert({
      session_id: payload.sessionId,
      stripe_checkout_session_id: checkout.id,
      status: "checkout_created",
      amount_total: checkout.amount_total,
      currency: checkout.currency,
    });

    if (paymentError) {
      const error = isSupabaseUnavailable(paymentError)
        ? supabaseUnavailableMessage
        : databaseErrorMessage("Checkout was created, but payment could not be saved.", paymentError);

      return NextResponse.json(
        { error },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ url: checkout.url, demo: false });
}
