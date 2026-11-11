"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PaymentActions({ paymentId, sessionId, pending }: { paymentId: string; sessionId: string; pending: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currency, setCurrency] = useState("mad");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  async function act(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setCopied(false);
    try {
      const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
      const response = await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending ? { action: "approve", paymentId, amount: Math.round(Number(amount) * 10 ** digits), currency, reference }
          : { action: "link", sessionId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUrl(data.url); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Request failed."); }
    finally { setBusy(false); }
  }
  return <div className="min-w-64 max-w-md">
    <form onSubmit={act} className="grid gap-2">
      {pending && <>
        <label className="text-xs">Amount received<input aria-label="Amount received" type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full rounded border p-2" /></label>
        <label className="text-xs">Currency<select value={currency} onChange={(e) => setCurrency(e.target.value)} className="ms-2 rounded border p-2"><option value="mad">MAD</option><option value="eur">EUR</option><option value="usd">USD</option></select></label>
        <label className="text-xs">Bank reference<input required maxLength={200} value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1 block w-full rounded border p-2" /></label>
      </>}
      <button disabled={busy} className="rounded-lg bg-[#1f3f34] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {busy ? "Saving…" : pending ? "Confirm receipt & create access link" : "Create new access link"}
      </button>
    </form>
    {error && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
    {url && <div className="mt-3 rounded-lg bg-white p-3">
      <label className="block text-xs">Access link<input readOnly value={url} onFocus={(e) => e.target.select()} className="mt-1 block w-full rounded border p-2 text-xs" /></label>
      <button type="button" className="mt-2 text-sm font-semibold underline" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); } catch { setError("Select the link above and copy it manually."); } }}>{copied ? "Copied" : "Copy link"}</button>
      <p className="mt-1 text-xs text-[#5b665e]">Send this link to the client on WhatsApp. It expires in 7 days and can be used once. Creating another link replaces the previous unused link.</p>
    </div>}
  </div>;
}
