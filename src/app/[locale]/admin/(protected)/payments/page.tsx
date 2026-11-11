import { getAdminPayments } from "@/lib/admin/payments";
import { PaymentActions } from "@/components/admin/PaymentActions";

export default async function PaymentsPage() {
  const payments = await getAdminPayments();
  return <main className="mx-auto max-w-7xl px-5 py-10">
    <h1 className="text-3xl font-semibold">Payments</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6">Confirm bank transfers only after checking the money has arrived. Record the actual amount and currency received, then copy the access link to send on WhatsApp. The latest 500 payments are shown.</p>
    <div className="mt-7 overflow-x-auto rounded-xl border border-[#c6c7bd] bg-[#fbf9f8]">
      <table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-[#e9ede5]"><tr>{["Reference / email", "Method / status", "Received", "Access"].map((text) => <th key={text} className="p-4">{text}</th>)}</tr></thead>
        <tbody>{payments.map((payment) => <tr key={payment.id} className="border-t border-[#c6c7bd] align-top">
          <td className="p-4"><p className="break-all font-mono text-xs">{payment.id}</p><p className="mt-2 break-all">{payment.email ?? "Not provided"}</p><p className="mt-2 text-xs text-[#5b665e]">{new Date(payment.created_at).toLocaleString("en-GB", { timeZone: "Africa/Casablanca" })}</p></td>
          <td className="p-4"><p>{payment.method === "bank_transfer" ? "Bank transfer" : payment.method}</p><p className="mt-2 font-semibold">{payment.status}</p></td>
          <td className="p-4">{payment.amount_total != null && payment.currency ? new Intl.NumberFormat("en", { style: "currency", currency: payment.currency }).format(payment.amount_total / 10 ** (new Intl.NumberFormat("en", { style: "currency", currency: payment.currency }).resolvedOptions().maximumFractionDigits ?? 2)) : "—"}<p className="mt-2 text-xs">{payment.transfer_reference}</p></td>
          <td className="p-4">{(payment.method === "bank_transfer" && payment.status === "pending") || ["paid", "no_payment_required"].includes(payment.status)
            ? <PaymentActions paymentId={payment.id} sessionId={payment.session_id} pending={payment.method === "bank_transfer" && payment.status === "pending"} /> : "Awaiting payment"}</td>
        </tr>)}{!payments.length && <tr><td colSpan={4} className="p-8 text-center">No payment requests yet.</td></tr>}</tbody>
      </table>
    </div>
  </main>;
}
