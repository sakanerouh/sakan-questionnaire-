import type { Metadata } from "next";
import { routing, type AppLocale } from "./routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
const openGraphLocales: Record<AppLocale, string> = {
  en: "en_US",
  fr: "fr_FR",
  ar: "ar_SA",
};

export function localizedMetadata({
  locale,
  pathname = "",
  title,
  description,
}: {
  locale: AppLocale;
  pathname?: string;
  title: string;
  description: string;
}): Metadata {
  const path = pathname ? `/${pathname.replace(/^\//, "")}` : "";
  const canonical = `${siteUrl}/${locale}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(routing.locales.map((item) => [item, `${siteUrl}/${item}${path}`])),
        "x-default": `${siteUrl}/en${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: openGraphLocales[locale],
      alternateLocale: routing.locales
        .filter((item) => item !== locale)
        .map((item) => openGraphLocales[item]),
      siteName: "Sakan eRouh",
      type: "website",
    },
  };
}
