import { getOperationsData } from "@/lib/admin/operations";
import { requireAdminPage } from "@/lib/admin/auth";
import { normalizeLocale } from "@/i18n/routing";
import { connection } from "next/server";

const formatMoney = (minor: number, currency: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() }).format(minor / 100);

export default async function AdminOperationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string; to?: string; locale?: string }>;
}) {
  await connection();
  const routeLocale = normalizeLocale((await params).locale);
  await requireAdminPage(routeLocale);
  const query = await searchParams;
  const selectedLocale = query.locale === "en" || query.locale === "fr" || query.locale === "ar" ? query.locale : "all";
  const data = await getOperationsData({ from: query.from, to: query.to, locale: selectedLocale });
  const exportParams = new URLSearchParams();
  if (query.from) exportParams.set("from", query.from);
  if (query.to) exportParams.set("to", query.to);
  if (selectedLocale !== "all") exportParams.set("locale", selectedLocale);
  const cards = [
    ["Starts", data.metrics.starts],
    ["Completions", `${data.metrics.completions} (${data.metrics.completionRate}%)`],
    ["Paid", `${data.metrics.paid} (${data.metrics.conversionRate}%)`],
    ["Revenue", formatMoney(data.metrics.revenue, data.metrics.currency)],
    ["Report failures", data.metrics.reportFailures],
    ["Languages", `${data.metrics.english} EN · ${data.metrics.french} FR · ${data.metrics.arabic} AR`],
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#82542A]">Operations</p><h1 className="mt-2 font-serif text-4xl">Audit overview</h1><p className="mt-2 text-sm text-[#464840]">Participant references are anonymized. Written answers and emails are never loaded here.</p></div>
        <a href={`/api/admin/operations/export?${exportParams}`} className="rounded-xl bg-[#28301C] px-5 py-3 text-sm font-semibold text-white">Export privacy-safe CSV</a>
      </div>
      <form className="mt-7 flex flex-wrap items-end gap-3 rounded-2xl border border-[#C6C7BD] bg-[#FBF9F8] p-4">
        <label className="text-xs font-semibold">From<input name="from" type="date" defaultValue={query.from} className="mt-1 block rounded-lg border border-[#C6C7BD] bg-white px-3 py-2" /></label>
        <label className="text-xs font-semibold">To<input name="to" type="date" defaultValue={query.to} className="mt-1 block rounded-lg border border-[#C6C7BD] bg-white px-3 py-2" /></label>
        <label className="text-xs font-semibold">Language<select name="locale" defaultValue={selectedLocale} className="mt-1 block rounded-lg border border-[#C6C7BD] bg-white px-3 py-2"><option value="all">All</option><option value="en">English</option><option value="fr">French</option><option value="ar">Arabic</option></select></label>
        <button className="rounded-lg bg-[#3E4631] px-4 py-2 text-sm font-semibold text-white">Apply filters</button>
      </form>
      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label, value]) => <article key={label} className="rounded-2xl border border-[#C6C7BD] bg-[#FBF9F8] p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#82542A]">{label}</p><p className="mt-3 text-3xl font-semibold">{value}</p></article>)}</section>
      <section className="mt-8 overflow-hidden rounded-2xl border border-[#C6C7BD] bg-[#FBF9F8]">
        <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-[#EAE8E7] text-xs uppercase tracking-wide"><tr>{["Reference","Language","Started","Progress","Result","Payment","Amount","Report"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead><tbody>{data.rows.map((row) => <tr key={row.participantRef} className="border-t border-[#E4E2E2]"><td className="px-4 py-3 font-mono text-xs">{row.participantRef}</td><td className="px-4 py-3 uppercase">{row.locale}</td><td className="px-4 py-3">{new Date(row.startedAt).toLocaleString()}</td><td className="px-4 py-3">{row.completed ? "Completed" : row.currentScreenId ?? "Started"}</td><td className="px-4 py-3">{row.dominant ? `${row.dominant} / ${row.secondary}` : "—"}</td><td className="px-4 py-3">{row.paymentStatus}</td><td className="px-4 py-3">{row.amount != null && row.currency ? formatMoney(row.amount, row.currency) : "—"}</td><td className="px-4 py-3">{row.reportStatus}</td></tr>)}</tbody></table></div>
        {!data.rows.length && <p className="p-8 text-center text-sm text-[#76786F]">No sessions match these filters.</p>}
        {data.truncated && <p className="border-t border-[#E4E2E2] p-3 text-xs text-[#82542A]">Showing the newest 100 records. Use filters or CSV export for a larger set.</p>}
      </section>
    </main>
  );
}
