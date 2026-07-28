import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import type { AppLocale } from "@/i18n/routing";
import { questionnaireScreens } from "./questionnaire";
import type { Answers } from "./schemas";

const dictionaries = { en, fr } as const;

export const getDictionary = (locale: AppLocale) => dictionaries[locale];

export function questionnaireOptionLabel(
  locale: AppLocale,
  questionId: string,
  optionId: string,
): string {
  const screens = getDictionary(locale).questionnaire.screens as Record<
    string,
    { options?: Record<string, string> }
  >;
  return screens[questionId]?.options?.[optionId] ?? optionId;
}

export function localizedAnswersForReport(answers: Answers, locale: AppLocale) {
  return Object.fromEntries(
    questionnaireScreens
      .filter((screen) => screen.type === "question")
      .map((screen) => {
        const value = answers[screen.id];
        const other = answers[`${screen.id}__other`];

        if (screen.questionType === "text") {
          return [screen.id, typeof value === "string" ? value : ""];
        }

        const ids = Array.isArray(value)
          ? value
          : typeof value === "string" && value
            ? [value]
            : [];

        return [
          screen.id,
          {
            selections: ids.map((id) => ({
              id,
              label: questionnaireOptionLabel(locale, screen.id, id),
            })),
            other:
              ids.includes("other") && typeof other === "string" ? other : undefined,
          },
        ];
      })
      .filter(([, value]) => {
        if (typeof value === "string") return Boolean(value.trim());
        return (value as { selections: unknown[] }).selections.length > 0;
      }),
  );
}

export function localizedArchetype(locale: AppLocale, id: string) {
  const archetypes = getDictionary(locale).archetypes as Record<
    string,
    {
      name: string;
      short: string;
      coreFear: string;
      strategy: string;
      coreProtection: string;
      bodyStrategy: string;
      promise: string;
      currency: string;
      practices: string[];
    }
  >;
  return archetypes[id];
}
