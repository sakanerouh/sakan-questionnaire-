import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { archetypes } from "./archetypes";
import { generatedReportSchema, type GeneratedReport } from "./generatedReport";
import { localizedAnswersForReport, localizedArchetype } from "./localizedQuestionnaire";
import { calculateResult } from "./scoring";
import { reportLanguageInstruction } from "./reportLocale";
import type { Answers, SakanResult, SupportedLocale } from "./schemas";

type ResultGenerationInput = {
  sessionId: string;
  answers: Answers;
  locale: SupportedLocale;
};

type ReportGenerationInput = {
  answers: Answers;
  result: SakanResult;
  locale: SupportedLocale;
};

const archetypeIdSchema = z.enum(["anticipator", "performer", "harmonizer", "quiter"]);
const scoreMapSchema = z.object({
  anticipator: z.number(),
  performer: z.number(),
  harmonizer: z.number(),
  quiter: z.number(),
});

const aiResultSchema = z.object({
  dominant: archetypeIdSchema,
  secondary: archetypeIdSchema,
  scores: scoreMapSchema,
  distribution: scoreMapSchema,
  keyPatterns: z.array(z.string()),
  shadowThemes: z.array(z.string()),
  dreamSabotageThemes: z.array(z.string()),
  protectionThemes: z.array(z.string()),
});

const systemPrompt = `You write premium SakanBody Audit reports.

Rules:
- Preserve the supplied dominant and secondary protective roles exactly. Do not invent a new role.
- Ground every insight in the supplied questionnaire answers and score data.
- Use direct, soulful, specific language. Be profound without becoming vague.
- Use phrases like "your answers suggest", "this may point to", and "one possible pattern is".
- Do not diagnose, treat, or claim to provide therapy or medical advice.
- Do not invent childhood events, trauma, identities, or facts not present in the answers.
- Use the supplied protective role names exactly. Do not use retired names like The Anticipator, The Performer, or The Quiter.
- If you mention numeric role strength, use only the supplied 0-100 intensity scores. Do not call them percentages, do not add percent signs, and do not mention distribution shares.
- Avoid generic filler. Make the report useful, concrete, and compassionate.
- Return only structured JSON that matches the schema.`;

const archetypePrompt = `You are an expert SakanBody protective role analyst.

Rules:
- Choose the dominant and secondary protective roles from the four provided roles only.
- Base the choice on the user's questionnaire answers, not on a precomputed score.
- The secondary protective role must be different from the dominant protective role.
- Scores should be comparative intensity scores from 0 to 100.
- Distribution should be percentages that roughly total 100.
- Scores and distribution are different metrics. If explanatory prose is generated later, it should cite scores as 0-100 intensity scores, not percentages.
- Extract concrete patterns from the answers. Do not diagnose, treat, or claim medical or therapeutic authority.
- For extracted themes, return exact stable option IDs from the supplied selections, never translated labels.
- Return only structured JSON that matches the schema.`;

const archetypeReference = Object.fromEntries(
  Object.entries(archetypes).map(([id, meta]) => [
    id,
    {
      name: meta.name,
      short: meta.short,
      coreProtection: meta.coreProtection,
      bodyStrategy: meta.bodyStrategy,
      coreFear: meta.coreFear,
      strategy: meta.strategy,
      promise: meta.promise,
      currency: meta.currency,
    },
  ]),
);

const createOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey?.trim()) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
};

const getReportModel = () => process.env.OPENAI_REPORT_MODEL?.trim() || "gpt-5.5";
const getReportMaxOutputTokens = () =>
  Number(process.env.OPENAI_REPORT_MAX_OUTPUT_TOKENS ?? 9000);

export async function generateAiResult({
  sessionId,
  answers,
  locale,
}: ResultGenerationInput): Promise<SakanResult> {
  const openai = createOpenAIClient();
  const model = getReportModel();

  const response = await openai.responses.parse({
    model,
    input: [
      {
        role: "system",
        content: archetypePrompt,
      },
      {
        role: "user",
        content: JSON.stringify({
          task:
            "Analyze these questionnaire answers and decide the SakanBody protective role result.",
          protectiveRoles: archetypeReference,
          answers: localizedAnswersForReport(answers, locale),
        }),
      },
    ],
    max_output_tokens: 2500,
    reasoning: { effort: "medium" },
    text: {
      format: zodTextFormat(aiResultSchema, "sakanbody_ai_archetype_result"),
    },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("The model did not return a structured protective role result.");
  }

  const result = aiResultSchema.parse(parsed);
  const stableThemes = calculateResult(sessionId, answers, locale);
  const secondary =
    result.secondary === result.dominant
      ? (Object.entries(result.scores)
          .filter(([id]) => id !== result.dominant)
          .sort(([, a], [, b]) => b - a)[0]?.[0] as SakanResult["secondary"] | undefined)
      : result.secondary;

  if (!secondary) {
    throw new Error("The model did not identify a valid secondary protective role.");
  }

  return {
    ...result,
    secondary,
    id: globalThis.crypto?.randomUUID?.() ?? `${sessionId}-${Date.now()}`,
    sessionId,
    keyPatterns: stableThemes.keyPatterns,
    shadowThemes: stableThemes.shadowThemes,
    dreamSabotageThemes: stableThemes.dreamSabotageThemes,
    protectionThemes: stableThemes.protectionThemes,
    completedAt: new Date().toISOString(),
    resultLocale: locale,
  };
}

export async function generateAiReport({
  answers,
  result,
  locale,
}: ReportGenerationInput): Promise<GeneratedReport> {
  const openai = createOpenAIClient();
  const dominant = localizedArchetype(locale, result.dominant);
  const secondary = localizedArchetype(locale, result.secondary);
  const model = getReportModel();

  const response = await openai.responses.parse({
    model,
    input: [
      {
        role: "system",
        content: `${systemPrompt}\n- ${reportLanguageInstruction(locale)}\n- Keep user-written free-text responses in their original language and do not translate them.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          task:
            locale === "fr"
              ? "Créez un rapport introspectif personnalisé et approfondi de 8 à 12 pages à partir de ce résultat."
              : "Create a premium 8-12 page custom self-reflection report from this questionnaire result.",
          reportShape: {
            blocks:
              "Write 8 to 10 deep sections. Each section needs a title, a substantial body, reflection prompts, and practical practices.",
            sevenDayPlan:
              "Write exactly 7 days. Each day needs one practice and one reflection.",
            disclaimer:
              "Include a clear self-reflection disclaimer, not medical or therapeutic advice.",
          },
          scoredResult: {
            dominant: {
              id: result.dominant,
              name: dominant.name,
              short: dominant.short,
              coreProtection: dominant.coreProtection,
              bodyStrategy: dominant.bodyStrategy,
              coreFear: dominant.coreFear,
              strategy: dominant.strategy,
              promise: dominant.promise,
            },
            secondary: {
              id: result.secondary,
              name: secondary.name,
              short: secondary.short,
              coreProtection: secondary.coreProtection,
              bodyStrategy: secondary.bodyStrategy,
              coreFear: secondary.coreFear,
              strategy: secondary.strategy,
              promise: secondary.promise,
            },
            scores: result.scores,
            keyPatterns: result.keyPatterns,
            shadowThemes: result.shadowThemes,
            dreamSabotageThemes: result.dreamSabotageThemes,
            protectionThemes: result.protectionThemes,
          },
          answers: localizedAnswersForReport(answers, locale),
        }),
      },
    ],
    max_output_tokens: getReportMaxOutputTokens(),
    reasoning: { effort: "medium" },
    text: {
      format: zodTextFormat(generatedReportSchema, "sakanbody_generated_report"),
    },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("The model did not return a structured report.");
  }

  return generatedReportSchema.parse(parsed);
}
