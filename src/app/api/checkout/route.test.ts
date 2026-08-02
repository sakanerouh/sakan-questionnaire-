import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createCheckoutSession, getSupabaseAdmin } = vi.hoisted(() => ({
  createCheckoutSession: vi.fn(),
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    checkout = { sessions: { create: createCheckoutSession } };
  },
}));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin }));
vi.mock("@/lib/supabase/errors", () => ({
  databaseErrorMessage: vi.fn(),
  isSupabaseUnavailable: vi.fn(),
  supabaseUnavailableMessage: "Supabase is unavailable.",
}));
vi.mock("@/lib/schemas", async () => {
  const { z } = await import("zod");

  return { localeSchema: z.enum(["en", "fr"]) };
});

import { POST } from "./route";

function checkoutRequest() {
  return new Request("https://example.com/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sessionId: "test-session",
      reportId: "test-report",
      email: "",
      locale: "en",
    }),
  });
}

describe("checkout configuration safety", () => {
  beforeEach(() => {
    createCheckoutSession.mockReset();
    getSupabaseAdmin.mockReset();
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_PRICE_ID", "");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    vi.stubEnv("ENABLE_DEMO_UNLOCK", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails closed in production when Stripe configuration is incomplete", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_DEMO_UNLOCK", "true");

    const response = await POST(checkoutRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Payment is temporarily unavailable.",
    });
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("rejects a test Stripe key in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_example");
    vi.stubEnv("STRIPE_PRICE_ID", "price_example");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_example");

    const response = await POST(checkoutRequest());

    expect(response.status).toBe(503);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("allows demo unlocks only when explicitly enabled in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENABLE_DEMO_UNLOCK", "true");
    getSupabaseAdmin.mockReturnValue(null);

    const response = await POST(checkoutRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.demo).toBe(true);
    expect(body.url).toContain("demo_unlocked=1");
    expect(getSupabaseAdmin).toHaveBeenCalledOnce();
  });

  it("fails closed in development when demo unlocks are not enabled", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const response = await POST(checkoutRequest());

    expect(response.status).toBe(503);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("enables customer-entered promotion codes in Stripe Checkout", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_example");
    vi.stubEnv("STRIPE_PRICE_ID", "price_example");
    getSupabaseAdmin.mockReturnValue(null);
    createCheckoutSession.mockResolvedValue({
      id: "cs_test_example",
      url: "https://checkout.stripe.com/example",
      amount_total: 2000,
      currency: "usd",
    });

    const response = await POST(checkoutRequest());

    expect(response.status).toBe(200);
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ allow_promotion_codes: true }),
    );
  });
});
