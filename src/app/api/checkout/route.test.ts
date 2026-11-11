import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queryResult } from "@/test/queryResult";

const mocks = vi.hoisted(() => ({ create: vi.fn(), retrieve: vi.fn(), access: vi.fn(), grant: vi.fn(), from: vi.fn(), prepare: vi.fn(), fulfill: vi.fn() }));
vi.mock("stripe", () => ({ default: class { checkout = { sessions: { create: mocks.create, retrieve: mocks.retrieve } }; } }));
vi.mock("@/lib/audit/access", () => ({
  auditDatabase: () => ({ from: mocks.from }), requireAuditAccess: mocks.access, getAuditGrant: mocks.grant,
  demoEnabled: () => process.env.NODE_ENV === "development" && process.env.ENABLE_DEMO_UNLOCK === "true",
}));
vi.mock("@/lib/audit/payments", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/audit/payments")>(), preparePayment: mocks.prepare, fulfillStripeCheckout: mocks.fulfill }));
import { POST } from "./route";
import { AuditError } from "@/lib/audit/http";

function request(body: Record<string, unknown> = {}, origin = "https://example.com") {
  return new Request("https://example.com/api/checkout", { method: "POST", headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ sessionId: "audit", email: "client@example.com", locale: "en", ...body }) });
}

describe("audit checkout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_example");
    vi.stubEnv("STRIPE_PRICE_ID", "price_audit"); vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_example"); vi.stubEnv("ENABLE_DEMO_UNLOCK", "false");
    mocks.access.mockResolvedValue({ session: { id: "audit", payment_flow: "pre_audit", locale: "en" }, paymentStatus: null });
    mocks.grant.mockResolvedValue(null);
    mocks.prepare.mockResolvedValue({ id: "payment", stripe_checkout_session_id: null, grants_access: false });
    mocks.from.mockImplementation(() => queryResult(null));
    mocks.create.mockResolvedValue({ id: "cs_test_new", url: "https://checkout.stripe.com/new" });
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID", "STRIPE_WEBHOOK_SECRET"])("fails closed when %s is missing", async (key) => {
    vi.stubEnv(key, ""); vi.stubEnv("ENABLE_DEMO_UNLOCK", "true");
    expect((await POST(request())).status).toBe(503); expect(mocks.access).not.toHaveBeenCalled();
  });
  it.each(["sk_test_example", "rk_test_example"])("rejects test key %s in production", async (key) => {
    vi.stubEnv("STRIPE_SECRET_KEY", key);
    expect((await POST(request())).status).toBe(503); expect(mocks.create).not.toHaveBeenCalled();
  });
  it("rejects cross-origin requests and invalid email", async () => {
    expect((await POST(request({}, "https://attacker.example"))).status).toBe(403);
    expect((await POST(request({ email: "" }))).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("requires the server session credential", async () => {
    mocks.access.mockRejectedValue(new AuditError(401, "Credential missing"));
    expect((await POST(request())).status).toBe(401); expect(mocks.prepare).not.toHaveBeenCalled();
  });
  it("creates prepaid checkout without a report, with discounts and stable idempotency", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ allow_promotion_codes: true, payment_method_types: ["card"],
      success_url: "https://example.com/en/questionnaire/payment?checkout_session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://example.com/en/questionnaire/payment?checkout=cancelled", metadata: { sessionId: "audit", paymentId: "payment", locale: "en" } }), { idempotencyKey: "audit-payment" });
  });
  it("reuses an open checkout without creating another", async () => {
    mocks.prepare.mockResolvedValue({ id: "payment", stripe_checkout_session_id: "cs_open" });
    mocks.retrieve.mockResolvedValue({ status: "open", url: "https://checkout.stripe.com/open" });
    expect(await (await POST(request())).json()).toMatchObject({ url: "https://checkout.stripe.com/open" });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("returns already-paid participants to their questions without another payment", async () => {
    mocks.grant.mockResolvedValue("paid");
    expect(await (await POST(request())).json()).toMatchObject({ url: "https://example.com/en/questionnaire/start" });
    expect(mocks.prepare).not.toHaveBeenCalled();
  });
  it("reconciles a completed checkout before allowing another attempt", async () => {
    mocks.prepare.mockResolvedValue({ id: "payment", stripe_checkout_session_id: "cs_complete" });
    mocks.retrieve.mockResolvedValue({ status: "complete" }); mocks.fulfill.mockResolvedValue({ granted: false });
    expect((await POST(request())).status).toBe(409); expect(mocks.create).not.toHaveBeenCalled();
  });
  it("retains the legacy report-payment return path and ownership check", async () => {
    mocks.access.mockResolvedValue({ session: { id: "audit", payment_flow: "post_audit", locale: "ar" } });
    mocks.from.mockImplementation(() => queryResult({ payment_status: "locked" }));
    expect((await POST(request({ reportId: "report" }))).status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ success_url: "https://example.com/ar/report/report?checkout_session_id={CHECKOUT_SESSION_ID}",
      metadata: expect.objectContaining({ reportId: "report" }) }), expect.anything());
  });
  it("never uses a report ID to bypass a new audit's prepaid contract", async () => {
    expect((await POST(request({ reportId: "forged" }))).status).toBe(400); expect(mocks.create).not.toHaveBeenCalled();
  });
  it("allows explicit development demo access but still persists its grant", async () => {
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("STRIPE_SECRET_KEY", ""); vi.stubEnv("ENABLE_DEMO_UNLOCK", "true");
    expect(await (await POST(request())).json()).toMatchObject({ demo: true, url: "https://example.com/en/questionnaire/start" });
    expect(mocks.prepare).toHaveBeenCalledWith("audit", "demo", "client@example.com", undefined);
  });
});
