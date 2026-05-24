import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { archetypes } from "./archetypes";
import { generatedReportSchema, type GeneratedReport } from "./generatedReport";
import type { Answers, SakanResult } from "./schemas";

type ResultGenerationInput = {
  sessionId: string;
  answers: Answers;
};

type ReportGenerationInput = {
  answers: Answers;
  result: SakanResult;
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

const answerToText = (value: unknown): string | string[] => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);

  if (typeof value === "string") return value.trim();

  if (value && typeof value === "object") {
    const item = value as { value?: unknown; other?: unknown };
    return [item.value, item.other]
      .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
      .map((part) => part.trim())
      .join(" - ");
  }

  return "";
};

const compactAnswers = (answers: Answers) =>
  Object.fromEntries(
    Object.entries(answers)
      .map(([id, value]) => [id, answerToText(value)] as const)
      .filter(([, value]) => Array.isArray(value) ? value.length > 0 : Boolean(value)),
  );

const systemPrompt = `You write premium SakanBody Audit reports.

Rules:
- Preserve the supplied dominant and secondary archetypes exactly. Do not invent a new archetype.
- Ground every insight in the supplied questionnaire answers and score data.
- Use direct, soulful, specific language. Be profound without becoming vague.
- Use phrases like "your answers suggest", "this may point to", and "one possible pattern is".
- Do not diagnose, treat, or claim to provide therapy or medical advice.
- Do not invent childhood events, trauma, identities, or facts not present in the answers.
- Avoid generic filler. Make the report useful, concrete, and compassionate.
- Return only structured JSON that matches the schema.`;

const archetypePrompt = `You are an expert SakanBody archetype analyst.

Rules:
- Choose the dominant and secondary archetypes from the four provided archetypes only.
- Base the choice on the user's questionnaire answers, not on a precomputed score.
- The secondary archetype must be different from the dominant archetype.
- Scores should be comparative intensity scores from 0 to 100.
- Distribution should be percentages that roughly total 100.
- Extract concrete patterns from the answers. Do not diagnose, treat, or claim medical or therapeutic authority.
- Return only structured JSON that matches the schema.`;

const archetypeReference = Object.fromEntries(
  Object.entries(archetypes).map(([id, meta]) => [
    id,
    {
      name: meta.name,
      short: meta.short,
      coreProtection: meta.coreProtection,
      bodyStrategy: meta.bodyStrategy,
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

export async function generateAiResult({
  sessionId,
  answers,
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
            "Analyze these questionnaire answers and decide the SakanBody archetype result.",
          archetypes: archetypeReference,
          answers: compactAnswers(answers),
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
    throw new Error("The model did not return a structured archetype result.");
  }

  const result = aiResultSchema.parse(parsed);
  const secondary =
    result.secondary === result.dominant
      ? (Object.entries(result.scores)
          .filter(([id]) => id !== result.dominant)
          .sort(([, a], [, b]) => b - a)[0]?.[0] as SakanResult["secondary"] | undefined)
      : result.secondary;

  if (!secondary) {
    throw new Error("The model did not identify a valid secondary archetype.");
  }

  return {
    ...result,
    secondary,
    id: globalThis.crypto?.randomUUID?.() ?? `${sessionId}-${Date.now()}`,
    sessionId,
    keyPatterns: result.keyPatterns.slice(0, 12),
    shadowThemes: result.shadowThemes.slice(0, 10),
    dreamSabotageThemes: result.dreamSabotageThemes.slice(0, 10),
    protectionThemes: result.protectionThemes.slice(0, 10),
    completedAt: new Date().toISOString(),
  };
}

export async function generateAiReport({
  answers,
  result,
}: ReportGenerationInput): Promise<GeneratedReport> {
  const openai = createOpenAIClient();
  const dominant = archetypes[result.dominant];
  const secondary = archetypes[result.secondary];
  const model = getReportModel();

  const response = await openai.responses.parse({
    model,
    input: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: JSON.stringify({
          task:
            "Create a premium 8-12 page custom self-reflection report from this questionnaire result.",
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
              promise: dominant.promise,
            },
            secondary: {
              id: result.secondary,
              name: secondary.name,
              short: secondary.short,
              coreProtection: secondary.coreProtection,
              bodyStrategy: secondary.bodyStrategy,
              promise: secondary.promise,
            },
            scores: result.scores,
            distribution: result.distribution,
            keyPatterns: result.keyPatterns,
            shadowThemes: result.shadowThemes,
            dreamSabotageThemes: result.dreamSabotageThemes,
            protectionThemes: result.protectionThemes,
          },
          answers: compactAnswers(answers),
        }),
      },
    ],
    max_output_tokens: 9000,
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
