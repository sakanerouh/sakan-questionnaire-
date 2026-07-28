import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResultPageClient } from "@/components/questionnaire/ResultPageClient";
import { localizedMetadata } from "@/i18n/metadata";
import { normalizeLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = normalizeLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "metadata.result" });
  return localizedMetadata({ locale, pathname: "questionnaire/result", title: t("title"), description: t("description") });
}

export default async function QuestionnaireResult({ params }: Props) {
  const locale = normalizeLocale((await params).locale);
  setRequestLocale(locale);
  return <ResultPageClient />;
}
