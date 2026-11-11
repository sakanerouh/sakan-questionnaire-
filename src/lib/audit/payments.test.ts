import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryResult } from "@/test/queryResult";
import type Stripe from "stripe";
const mocks = vi.hoisted(() => ({ retrieve: vi.fn(), from: vi.fn(), rpc: vi.fn(), session: vi.fn() }));
vi.mock("./access", () => ({ auditDatabase: () => ({ from: mocks.from, rpc: mocks.rpc }), findAuditSession: mocks.session }));
import { fulfillStripeCheckout } from "./payments";

const stripe = { checkout: { sessions: { retrieve: mocks.retrieve } } } as unknown as Stripe;
const checkout = (override: Record<string, unknown> = {}) => ({ id: "cs_audit", mode: "payment", status: "complete", payment_status: "paid",
  metadata: { sessionId: "audit", paymentId: "payment" }, amount_subtotal: 1100, amount_total: 1100, currency: "eur", total_details: { amount_discount: 0 },
  line_items: { data: [{ quantity: 1, price: { id: "price_audit" } }], has_more: false }, ...override });
describe("Stripe fulfillment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.retrieve.mockResolvedValue(checkout());
    mocks.session.mockResolvedValue({ payment_flow: "pre_audit" });
    mocks.from.mockImplementation(() => queryResult({ id: "payment", session_id: "audit", report_id: null, price_id: "price_audit", method: "card", stripe_checkout_session_id: "cs_audit" }));
    mocks.rpc.mockResolvedValue({ error: null });
  });
  it("retrieves canonical Stripe data and commits through the shared transaction", async () => {
    expect(await fulfillStripeCheckout(stripe, "cs_audit", "audit")).toMatchObject({ granted: true });
    expect(mocks.retrieve).toHaveBeenCalledWith("cs_audit", { expand: ["line_items"] });
    expect(mocks.rpc).toHaveBeenCalledWith("audit_fulfill_card", expect.objectContaining({ p_grants: true, p_session_id: "audit", p_payment_id: "payment" }));
  });
  it("rejects someone else's checkout on a return visit", async () => {
    await expect(fulfillStripeCheckout(stripe, "cs_audit", "foreign")).rejects.toMatchObject({ status: 400 });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("does not grant access for an unpaid checkout", async () => {
    mocks.retrieve.mockResolvedValue(checkout({ payment_status: "unpaid" }));
    expect((await fulfillStripeCheckout(stripe, "cs_audit")).granted).toBe(false);
  });
  it("does not grant access until checkout completes", async () => {
    mocks.retrieve.mockResolvedValue(checkout({ status: "open" }));
    expect((await fulfillStripeCheckout(stripe, "cs_audit")).granted).toBe(false);
  });
  it("honors a completed 100 percent promotion code", async () => {
    mocks.retrieve.mockResolvedValue(checkout({ payment_status: "no_payment_required", amount_total: 0, total_details: { amount_discount: 1100 } }));
    expect((await fulfillStripeCheckout(stripe, "cs_audit")).granted).toBe(true);
  });
  it("does not confuse a zero-priced product with a discounted purchase", async () => {
    mocks.retrieve.mockResolvedValue(checkout({ payment_status: "no_payment_required", amount_subtotal: 0, amount_total: 0, total_details: { amount_discount: 0 } }));
    expect((await fulfillStripeCheckout(stripe, "cs_audit")).granted).toBe(false);
  });
  it.each([
    { metadata: { sessionId: "audit" } },
    { metadata: { sessionId: "audit", paymentId: "payment", reportId: "forged" } },
    { mode: "subscription" },
    { line_items: { data: [{ quantity: 1, price: { id: "different_product" } }] } },
    { line_items: { data: [{ quantity: 2, price: { id: "price_audit" } }] } },
  ])("rejects incompatible metadata, product or quantity %#", async (override) => {
    mocks.retrieve.mockResolvedValue(checkout(override));
    await expect(fulfillStripeCheckout(stripe, "cs_audit")).rejects.toMatchObject({ status: 400 });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("returns a retryable error when persistence fails", async () => {
    mocks.rpc.mockResolvedValue({ error: { message: "Database unavailable" } });
    await expect(fulfillStripeCheckout(stripe, "cs_audit")).rejects.toMatchObject({ status: 503 });
  });
  it("supports an already-open legacy checkout without paymentId metadata", async () => {
    mocks.retrieve.mockResolvedValue(checkout({ metadata: { sessionId: "audit", reportId: "report" } }));
    mocks.session.mockResolvedValue({ payment_flow: "post_audit" });
    mocks.from.mockImplementation((table) => queryResult(table === "reports" ? { id: "report" } : { session_id: "audit", report_id: null, price_id: "price_audit", method: "card", stripe_checkout_session_id: "cs_audit" }));
    expect((await fulfillStripeCheckout(stripe, "cs_audit")).granted).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("audit_fulfill_card", expect.objectContaining({ p_payment_id: null, p_report_id: "report" }));
  });
});
