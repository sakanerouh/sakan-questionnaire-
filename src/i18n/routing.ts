import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
  localeCookie: {
    name: "NEXT_LOCALE",
    sameSite: "lax",
  },
});

export type AppLocale = (typeof routing.locales)[number];

export const isAppLocale = (value: unknown): value is AppLocale =>
  typeof value === "string" && routing.locales.includes(value as AppLocale);

export const normalizeLocale = (value: unknown): AppLocale =>
  isAppLocale(value) ? value : routing.defaultLocale;
