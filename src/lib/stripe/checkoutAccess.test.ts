import { describe, expect, it } from "vitest";
import { checkoutGrantsReportAccess } from "./checkoutAccess";

const checkout = (overrides: Partial<Parameters<typeof checkoutGrantsReportAccess>[0]> = {}) => ({
  amount_subtotal: 2000,
  amount_total: 2000,
  payment_status: "unpaid" as const,
  status: "complete" as const,
  total_details: {
    amount_discount: 0,
    amount_shipping: 0,
    amount_tax: 0,
  },
  ...overrides,
});

describe("checkout report access", () => {
  it("grants access to paid Checkout sessions", () => {
    expect(
      checkoutGrantsReportAccess(
        checkout({ payment_status: "paid", amount_total: 2000 }),
      ),
    ).toBe(true);
  });

  it("grants access to completed sessions with a 100% discount", () => {
    expect(
      checkoutGrantsReportAccess(
        checkout({
          amount_total: 0,
          payment_status: "no_payment_required",
          total_details: {
            amount_discount: 2000,
            amount_shipping: 0,
            amount_tax: 0,
          },
        }),
      ),
    ).toBe(true);
  });

  it("does not grant access to an undiscounted zero-total session", () => {
    expect(
      checkoutGrantsReportAccess(
        checkout({
          amount_subtotal: 0,
          amount_total: 0,
          payment_status: "no_payment_required",
        }),
      ),
    ).toBe(false);
  });

  it("does not grant access before Checkout is complete", () => {
    expect(
      checkoutGrantsReportAccess(
        checkout({
          amount_total: 0,
          payment_status: "no_payment_required",
          status: "open",
          total_details: {
            amount_discount: 2000,
            amount_shipping: 0,
            amount_tax: 0,
          },
        }),
      ),
    ).toBe(false);
  });
});
