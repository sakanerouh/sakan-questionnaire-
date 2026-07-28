import type { SupportedLocale } from "./schemas";

export const reportLanguageInstruction = (locale: SupportedLocale) =>
  locale === "fr"
    ? "Write the complete report in natural, warm French using respectful vous language."
    : "Write the complete report in natural English.";
