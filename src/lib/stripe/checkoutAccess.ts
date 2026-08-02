import type Stripe from "stripe";

type CheckoutAccessSession = Pick<
  Stripe.Checkout.Session,
  | "amount_subtotal"
  | "amount_total"
  | "payment_status"
  | "status"
  | "total_details"
>;

export function checkoutGrantsReportAccess(checkout: CheckoutAccessSession) {
  if (checkout.payment_status === "paid") {
    return true;
  }

  const subtotal = checkout.amount_subtotal;
  const discount = checkout.total_details?.amount_discount ?? 0;

  return (
    checkout.status === "complete" &&
    checkout.payment_status === "no_payment_required" &&
    subtotal !== null &&
    subtotal > 0 &&
    checkout.amount_total === 0 &&
    discount >= subtotal
  );
}
