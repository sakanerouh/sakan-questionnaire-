import { connection } from "next/server";
import { normalizeLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/admin/auth";
import { contactFilterInput, contactFiltersSchema, contactQueryParams } from "@/lib/admin/contacts";
import { getAuditContacts } from "@/lib/admin/contacts.server";

const fieldClass = "mt-1 block min-w-0 w-full rounded-lg border border-[#C6C7BD] bg-white px-3 py-2 text-sm";
const formatDate = (date: string) => new Intl.DateTimeFormat("en", {
  dateStyle: "medium", timeZone: "UTC",
}).format(new Date(date));

export default async function AdminContactsPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const locale = normalizeLocale((await params).locale);
  await requireAdminPage(locale);
  const query = await searchParams;
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") urlParams.set(key, value);
  }
  const parsed = contactFiltersSchema.safeParse(contactFilterInput(urlParams));
  const filters = parsed.success ? parsed.data : contactFiltersSchema.parse({});
  let error = parsed.success ? "" : "Check your filters: use valid dates, with the end date on or after the start date.";
  let contacts: Awaited<ReturnType<typeof getAuditContacts>> = [];
  if (parsed.success) {
    try {
      contacts = await getAuditContacts(filters);
    } catch (cause) {
      if (cause instanceof Error && cause.message === "ADMIN_UNAUTHORIZED") throw cause;
      error = cause instanceof Error ? cause.message : "Contacts could not be loaded. Please try again.";
    }
  }
  const pageSize = 50;
  const pages = Math.max(1, Math.ceil(contacts.length / pageSize));
  const requestedPage = Number(urlParams.get("page") ?? 1);
  const page = Number.isSafeInteger(requestedPage) ? Math.min(pages, Math.max(1, requestedPage)) : 1;
  const rows = contacts.slice((page - 1) * pageSize, page * pageSize);
  const exportParams = contactQueryParams(filters);
  const pageHref = (target: number) => {
    const params = contactQueryParams(filters);
    params.set("page", String(target));
    return `/${locale}/admin/contacts?${params}`;
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#82542A]">Contacts</p>
          <h1 className="mt-2 font-serif text-4xl">Audit email contacts</h1>
          <p className="mt-2 text-sm leading-6 text-[#464840]">Find people who provided an email during their audit. Each address appears once, with repeat audits grouped together.</p>
        </div>
        {!error && contacts.length > 0 && <a href={`/api/admin/contacts/export?${exportParams}`} className="rounded-xl bg-[#28301C] px-5 py-3 text-sm font-semibold text-white">Export {contacts.length} email{contacts.length === 1 ? "" : "s"} (CSV)</a>}
      </div>

      <form className="mt-7 flex flex-wrap items-end gap-3 rounded-2xl border border-[#C6C7BD] bg-[#FBF9F8] p-4">
        <label className="min-w-0 basis-full text-xs font-semibold sm:basis-auto sm:grow">Search email<input name="q" type="search" maxLength={254} defaultValue={urlParams.get("q") ?? ""} placeholder="name@example.com" className={fieldClass} /></label>
        <label className="min-w-0 text-xs font-semibold">From<input name="from" type="date" defaultValue={urlParams.get("from") ?? ""} className={fieldClass} /></label>
        <label className="min-w-0 text-xs font-semibold">To<input name="to" type="date" defaultValue={urlParams.get("to") ?? ""} className={fieldClass} /></label>
        <label className="text-xs font-semibold">Language<select name="locale" defaultValue={filters.locale} className={fieldClass}><option value="all">All languages</option><option value="en">English</option><option value="fr">French</option><option value="ar">Arabic</option></select></label>
        <label className="text-xs font-semibold">Audit status<select name="status" defaultValue={filters.status} className={fieldClass}><option value="all">All audits</option><option value="completed">Completed</option><option value="in_progress">In progress only</option></select></label>
        <button className="rounded-lg bg-[#3E4631] px-4 py-2 text-sm font-semibold text-white">Apply filters</button>
        <a href={`/${locale}/admin/contacts`} className="px-2 py-2 text-sm underline underline-offset-4">Reset</a>
      </form>

      <p className="mt-4 text-sm leading-6 text-[#464840]">Marketing consent is not recorded by the current audit. A saved email does not indicate a marketing opt-in. Exports include this status.</p>
      {error ? <div role="alert" className="mt-7 rounded-xl border border-[#C6C7BD] bg-[#FBF9F8] p-5"><p>{error}</p><a href={`/${locale}/admin/contacts`} className="mt-2 inline-block font-semibold underline underline-offset-4">Reload contacts</a></div> : (
        <section className="mt-7 overflow-hidden rounded-2xl border border-[#C6C7BD] bg-[#FBF9F8]" aria-label="Audit contacts">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E2E2] px-4 py-4">
            <p className="font-semibold">{contacts.length} unique email{contacts.length === 1 ? "" : "s"}</p>
            <p className="text-xs text-[#464840]">Dates in UTC · Only audits matching your filters are grouped</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#EAE8E7] text-xs uppercase tracking-wide"><tr>{["Email", "Language", "First audit", "Latest audit", "Audits", "Status"].map((heading) => <th key={heading} scope="col" className="px-4 py-3">{heading}</th>)}</tr></thead>
              <tbody>{rows.map((contact) => <tr key={contact.email} className="border-t border-[#E4E2E2]">
                <td className="max-w-[340px] break-all px-4 py-4"><a className="font-medium underline underline-offset-4" href={`mailto:${encodeURIComponent(contact.email)}`}>{contact.email}</a></td>
                <td className="px-4 py-4 uppercase">{contact.locale}</td>
                <td className="whitespace-nowrap px-4 py-4">{formatDate(contact.firstAuditAt)}</td>
                <td className="whitespace-nowrap px-4 py-4">{formatDate(contact.latestAuditAt)}</td>
                <td className="px-4 py-4">{contact.auditCount}</td>
                <td className="whitespace-nowrap px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${contact.completed ? "bg-[#E4E9DC] text-[#28301C]" : "bg-[#EAE8E7] text-[#464840]"}`}>{contact.completed ? "Completed" : "In progress"}</span></td>
              </tr>)}</tbody>
            </table>
          </div>
          {!contacts.length && <div className="p-8 text-center"><p className="font-semibold">No email contacts found</p><p className="mt-2 text-sm text-[#464840]">Try changing your filters. Audits without a saved email do not appear here.</p></div>}
          {pages > 1 && <nav aria-label="Contacts pagination" className="flex items-center justify-between border-t border-[#E4E2E2] px-4 py-4 text-sm">
            <div>{page > 1 && <a className="font-semibold underline underline-offset-4" href={pageHref(page - 1)}>Previous</a>}</div>
            <p>Page {page} of {pages}</p>
            <div>{page < pages && <a className="font-semibold underline underline-offset-4" href={pageHref(page + 1)}>Next</a>}</div>
          </nav>}
        </section>
      )}
    </main>
  );
}
