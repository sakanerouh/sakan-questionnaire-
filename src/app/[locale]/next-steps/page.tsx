import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { NextStepsPage } from "@/components/next-steps/NextStepsPage";
import { getNextStepsCopy } from "@/content/nextSteps";
import { localizedMetadata } from "@/i18n/metadata";
import { normalizeLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = normalizeLocale((await params).locale);
  const copy = getNextStepsCopy(locale);
  return localizedMetadata({ locale, pathname: "next-steps", title: copy.title, description: copy.description });
}

export default async function NextSteps({ params }: Props) {
  const locale = normalizeLocale((await params).locale);
  setRequestLocale(locale);
  return <NextStepsPage locale={locale} />;
}
