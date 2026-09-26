import type { SupportedLocale } from "./schemas";

export const reportLanguageInstruction = (locale: SupportedLocale) =>
  locale === "fr"
    ? "Write the complete report in natural, warm French using respectful vous language."
    : locale === "ar"
      ? "Write the complete report in warm, natural Modern Standard Arabic, addressing the reader in the feminine singular form."
    : "Write the complete report in natural English.";
