import { z } from "zod";
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import { questionnaireScreens, type Screen } from "./questionnaire";

const archetypeWeightsSchema = z
  .object({
    anticipator: z.number().optional(),
    performer: z.number().optional(),
    harmonizer: z.number().optional(),
    quiter: z.number().optional(),
  })
  .strict();

const optionSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  weights: archetypeWeightsSchema.optional(),
});

const screenSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.enum(["intro", "insight"]),
    sectionId: z.string().min(1),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("featured"),
    sectionId: z.string().min(1),
    childhoodQuestionId: z.string().min(1),
    sabotageQuestionId: z.string().min(1),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("question"),
    sectionId: z.string().min(1),
    questionType: z.enum(["single", "multi", "text"]),
    optional: z.boolean().optional(),
    options: z.array(optionSchema).optional(),
  }),
]);

export const questionnaireScreenCopySchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  prompt: z.string().optional(),
  helper: z.string().optional(),
  placeholder: z.string().optional(),
  options: z.record(z.string(), z.string()).optional(),
});

export const questionnaireTranslationSchema = z.object({
  sections: z.record(z.string(), z.string()),
  screens: z.record(z.string(), questionnaireScreenCopySchema),
});

export const questionnairePayloadSchema = z.object({
  screens: z.array(screenSchema).min(1),
  translations: z.object({
    en: questionnaireTranslationSchema,
    fr: questionnaireTranslationSchema,
  }),
});

export type QuestionnaireScreenCopy = z.infer<typeof questionnaireScreenCopySchema>;
export type QuestionnaireTranslation = z.infer<typeof questionnaireTranslationSchema>;
export type QuestionnairePayload = z.infer<typeof questionnairePayloadSchema>;

export type QuestionnaireSnapshot = QuestionnairePayload & {
  id: string;
  versionNumber: number;
  status: "draft" | "published" | "archived";
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  changeSummary?: string | null;
};

export const BUNDLED_QUESTIONNAIRE_VERSION_ID =
  "00000000-0000-4000-8000-000000000001";

const bundledTranslations = {
  en: en.questionnaire,
  fr: fr.questionnaire,
} as unknown as QuestionnairePayload["translations"];

export const bundledQuestionnairePayload: QuestionnairePayload =
  questionnairePayloadSchema.parse({
    screens: questionnaireScreens,
    translations: bundledTranslations,
  });

export const bundledQuestionnaireSnapshot: QuestionnaireSnapshot = {
  id: BUNDLED_QUESTIONNAIRE_VERSION_ID,
  versionNumber: 1,
  status: "published",
  ...bundledQuestionnairePayload,
};

const stableJson = (value: unknown): string => {
  if (!value || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
    .join(",")}}`;
};

export function validateQuestionnairePayload(input: unknown): QuestionnairePayload {
  const payload = questionnairePayloadSchema.parse(input);
  const baselineById = new Map(questionnaireScreens.map((screen) => [screen.id, screen]));
  const ids = payload.screens.map((screen) => screen.id);

  if (new Set(ids).size !== ids.length || ids.length !== questionnaireScreens.length) {
    throw new Error("The questionnaire must preserve every existing screen ID exactly once.");
  }

  for (const screen of payload.screens) {
    const baseline = baselineById.get(screen.id);
    if (!baseline) throw new Error(`Unknown screen ID: ${screen.id}`);
    if (screen.type !== baseline.type || screen.sectionId !== baseline.sectionId) {
      throw new Error(`Screen type and section are protected for ${screen.id}.`);
    }

    if (screen.type === "featured" && baseline.type === "featured") {
      if (
        screen.childhoodQuestionId !== baseline.childhoodQuestionId ||
        screen.sabotageQuestionId !== baseline.sabotageQuestionId
      ) {
        throw new Error(`Featured-screen references are protected for ${screen.id}.`);
      }
    }

    if (screen.type === "question" && baseline.type === "question") {
      if (screen.questionType !== baseline.questionType) {
        throw new Error(`Question type is protected for ${screen.id}.`);
      }

      const candidateOptions = new Map((screen.options ?? []).map((option) => [option.id, option]));
      const baselineOptions = baseline.options ?? [];
      if (candidateOptions.size !== baselineOptions.length) {
        throw new Error(`Choices cannot be added or removed for ${screen.id}.`);
      }
      for (const option of baselineOptions) {
        const candidate = candidateOptions.get(option.id);
        if (!candidate || stableJson(candidate.weights ?? {}) !== stableJson(option.weights ?? {})) {
          throw new Error(`Choice IDs and scoring weights are protected for ${screen.id}.`);
        }
      }
    }
  }

  for (const locale of ["en", "fr"] as const) {
    const translation = payload.translations[locale];
    for (const sectionId of new Set(payload.screens.map((screen) => screen.sectionId))) {
      if (!translation.sections[sectionId]?.trim()) {
        throw new Error(`Missing ${locale.toUpperCase()} section label for ${sectionId}.`);
      }
    }

    for (const screen of payload.screens) {
      const copy = translation.screens[screen.id];
      if (!copy) throw new Error(`Missing ${locale.toUpperCase()} copy for ${screen.id}.`);
      if (screen.type === "question") {
        if (!copy.prompt?.trim()) {
          throw new Error(`Missing ${locale.toUpperCase()} prompt for ${screen.id}.`);
        }
        for (const option of screen.options ?? []) {
          if (!copy.options?.[option.id]?.trim()) {
            throw new Error(
              `Missing ${locale.toUpperCase()} choice label ${screen.id}.${option.id}.`,
            );
          }
        }
      } else if (!copy.title?.trim() || !copy.body?.trim()) {
        throw new Error(`Missing ${locale.toUpperCase()} title or body for ${screen.id}.`);
      }
    }
  }

  payload.screens.forEach((screen, index) => {
    if (screen.type !== "featured") return;
    const childhoodIndex = ids.indexOf(screen.childhoodQuestionId);
    const sabotageIndex = ids.indexOf(screen.sabotageQuestionId);
    if (childhoodIndex < 0 || sabotageIndex < 0 || childhoodIndex >= index || sabotageIndex >= index) {
      throw new Error(`Referenced questions must appear before featured screen ${screen.id}.`);
    }
  });

  return payload;
}

export const questionScreensFrom = (screens: Screen[]) =>
  screens.filter(
    (screen): screen is Extract<Screen, { type: "question" }> => screen.type === "question",
  );
