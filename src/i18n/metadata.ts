import type { Metadata } from "next";
import type { AppLocale } from "./routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

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
        en: `${siteUrl}/en${path}`,
        fr: `${siteUrl}/fr${path}`,
        "x-default": `${siteUrl}/en${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: [locale === "fr" ? "en_US" : "fr_FR"],
      siteName: "Sakan eRouh",
      type: "website",
    },
  };
}
