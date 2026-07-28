import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReportPageClient } from "@/components/questionnaire/ReportPageClient";
import { localizedMetadata } from "@/i18n/metadata";
import { normalizeLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "metadata.report" });
  return localizedMetadata({ locale, pathname: "report", title: t("title"), description: t("description") });
}

export default async function ReportPage({ params }: Props) {
  const { locale: rawLocale, id } = await params;
  const locale = normalizeLocale(rawLocale);
  setRequestLocale(locale);
  return <ReportPageClient id={id} />;
}
