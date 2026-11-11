import { connection } from "next/server";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { normalizeLocale } from "@/i18n/routing";
import { localizedMetadata } from "@/i18n/metadata";
import { getAuditPrice } from "@/lib/audit/payments";
import { AuditCheckout } from "@/components/questionnaire/AuditCheckout";
import { demoEnabled } from "@/lib/audit/access";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = normalizeLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "auditCheckout" });
  return localizedMetadata({ locale, pathname: "questionnaire/checkout", title: t("title"), description: t("description") });
}
export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  await connection();
  setRequestLocale(normalizeLocale((await params).locale));
  return <AuditCheckout step="intro" price={await getAuditPrice()} demo={demoEnabled()} />;
}
