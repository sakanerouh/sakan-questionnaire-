import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LandingPage } from "@/components/LandingPage";
import { localizedMetadata } from "@/i18n/metadata";
import { normalizeLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = normalizeLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "metadata.home" });
  return localizedMetadata({ locale, title: t("title"), description: t("description") });
}

export default async function Home({ params }: Props) {
  const locale = normalizeLocale((await params).locale);
  setRequestLocale(locale);
  return <LandingPage />;
}
