import { connection } from "next/server";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { normalizeLocale } from "@/i18n/routing";
import { getAuditPrice } from "@/lib/audit/payments";
import { AuditCheckout } from "@/components/questionnaire/AuditCheckout";
import { demoEnabled } from "@/lib/audit/access";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const t = await getTranslations({ locale: normalizeLocale((await params).locale), namespace: "auditCheckout" });
  return { title: t("choose"), robots: { index: false, follow: false } };
}
export default async function PaymentPage({ params, searchParams }: {
  params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  setRequestLocale(normalizeLocale((await params).locale));
  const query = await searchParams;
  return <AuditCheckout step="payment" price={await getAuditPrice()} checkoutId={typeof query.checkout_session_id === "string" ? query.checkout_session_id : undefined} cancelled={query.checkout === "cancelled"} demo={demoEnabled()} />;
}
