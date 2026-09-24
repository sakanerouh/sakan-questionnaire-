import { normalizeLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/admin/auth";
import { connection } from "next/server";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await connection();
  const locale = normalizeLocale((await params).locale);
  const admin = await requireAdminPage(locale);
  return (
    <div className="min-h-screen bg-[#F5F3F3] text-[#28301C]">
      <header className="border-b border-[#C6C7BD] bg-[#FBF9F8]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#82542A]">Sakan eRouh</p>
            <p className="text-sm text-[#464840]">Private administration</p>
          </div>
          <nav className="flex items-center gap-2 text-sm font-semibold" aria-label="Admin navigation">
            <a className="rounded-full px-4 py-2 hover:bg-[#EAE8E7]" href={`/${locale}/admin`}>Operations</a>
            <a className="rounded-full px-4 py-2 hover:bg-[#EAE8E7]" href={`/${locale}/admin/questionnaire`}>Questionnaire</a>
          </nav>
          <div className="flex items-center gap-3 text-xs text-[#464840]">
            <span>{admin.displayName ?? admin.email}</span>
            <form action={`/api/admin/logout?locale=${locale}`} method="post">
              <button className="rounded-full border border-[#C6C7BD] px-4 py-2 font-semibold hover:bg-[#EAE8E7]" type="submit">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
