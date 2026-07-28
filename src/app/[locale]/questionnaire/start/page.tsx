import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { QuestionnaireFlow } from "@/components/questionnaire/QuestionnaireFlow";
import { localizedMetadata } from "@/i18n/metadata";
import { normalizeLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = normalizeLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "metadata.questionnaire" });
  return localizedMetadata({ locale, pathname: "questionnaire/start", title: t("title"), description: t("description") });
}

export default async function QuestionnaireStart({ params }: Props) {
  const locale = normalizeLocale((await params).locale);
  setRequestLocale(locale);
  return <QuestionnaireFlow />;
}
