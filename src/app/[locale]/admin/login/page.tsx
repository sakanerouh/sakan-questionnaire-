import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { normalizeLocale } from "@/i18n/routing";
import { getCurrentAdmin } from "@/lib/admin/auth";
import { connection } from "next/server";

export default async function AdminLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await connection();
  const locale = normalizeLocale((await params).locale);
  const admin = await getCurrentAdmin();
  if (admin) redirect(`/${locale}/admin`);
  const error = (await searchParams).error;
  const errorMessage =
    error === "unauthorized"
      ? "Your login was valid, but this account is not on the active administrator list."
      : error === "expired"
        ? "That login link is invalid or expired. Request a new one."
        : error === "configuration"
          ? "Admin authentication is not configured yet."
          : null;

  return (
    <main className="grid min-h-screen place-items-center bg-[#F5F3F3] px-5 py-12 text-[#28301C]">
      <section className="w-full max-w-md rounded-3xl border border-[#C6C7BD] bg-[#FBF9F8] p-8 shadow-[0_24px_80px_rgba(40,48,28,0.12)]">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#82542A]">Sakan eRouh</p>
        <h1 className="mt-4 font-serif text-4xl">Private administration</h1>
        <p className="mt-4 text-sm leading-6 text-[#464840]">
          Sign in with the email address that was invited to manage the questionnaire.
        </p>
        {errorMessage && (
          <p role="alert" className="mt-5 rounded-xl bg-[#FCE8E5] p-4 text-sm text-[#7A2E22]">
            {errorMessage}
          </p>
        )}
        <AdminLoginForm locale={locale} />
      </section>
    </main>
  );
}
