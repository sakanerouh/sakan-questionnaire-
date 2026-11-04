import { defineRouting } from "next-intl/routing";

// Keep stored French sessions and translations supported while public access is paused.
const supportedLocales = ["en", "fr", "ar"] as const;
export type AppLocale = (typeof supportedLocales)[number];
const hiddenLocales: readonly AppLocale[] = ["fr"];

export const routing = defineRouting({
  locales: supportedLocales.filter((locale) => !hiddenLocales.includes(locale)),
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
  localeCookie: {
    name: "NEXT_LOCALE",
    sameSite: "lax",
  },
});

export const isAppLocale = (value: unknown): value is AppLocale =>
  typeof value === "string" && supportedLocales.includes(value as AppLocale);

export const normalizeLocale = (value: unknown): AppLocale =>
  isAppLocale(value) ? value : routing.defaultLocale;
