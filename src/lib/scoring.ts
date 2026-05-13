import { archetypeOrder, emptyScores, type ArchetypeId } from "./archetypes";
import { questionnaireScreens } from "./questionnaire";
import type { Answers, SakanResult } from "./schemas";

const keywordWeights: Array<[RegExp, ArchetypeId]> = [
  [/plan|prepare|scenario|danger|worry|anxi|chaos|tight|race|future|anticip/i, "anticipator"],
  [/achiev|produc|proof|perfect|useful|lazy|success|work|edge|improv/i, "performer"],
  [/belong|peace|please|burden|disappoint|connection|loved|caret|small|harmony/i, "harmonizer"],
  [/tired|sleep|withdraw|avoid|exhaust|deplet|stop|slow|numb|lose interest/i, "quiter"],
];

const asArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
};

const add = (
  scores: Record<ArchetypeId, number>,
  weights: Partial<Record<ArchetypeId, number>> | undefined,
) => {
  if (!weights) return;
  for (const id of archetypeOrder) {
    scores[id] += weights[id] ?? 0;
  }
};

export function calculateResult(
  sessionId: string,
  answers: Answers,
): SakanResult {
  const scores = emptyScores();
  const keyPatterns: string[] = [];
  const shadowThemes: string[] = [];
  const dreamSabotageThemes: string[] = [];
  const protectionThemes: string[] = [];

  for (const screen of questionnaireScreens) {
    if (screen.type !== "question") continue;

    const values = asArray(answers[screen.id]);
    if (screen.questionType !== "text") {
      for (const value of values) {
        const option = screen.options?.find((item) => item.label === value);
        add(scores, option?.weights);

        if (option && option.label !== "Other") {
          if (["childhood-truths", "childhood-movement", "hard-to-stop", "slowing-fear"].includes(screen.id)) {
            keyPatterns.push(option.label);
          }

          if (["shadow-clues", "fascination-shares", "shadow-wants"].includes(screen.id)) {
            shadowThemes.push(option.label);
          }

          if (["looping-dream-areas", "sabotage-mechanism", "dream-shield"].includes(screen.id)) {
            dreamSabotageThemes.push(option.label);
          }

          if (["protection-accomplished", "strengths-forged", "jobs-done", "promotion"].includes(screen.id)) {
            protectionThemes.push(option.label);
          }
        }
      }
    } else {
      const text = values.join(" ");
      for (const [pattern, id] of keywordWeights) {
        if (pattern.test(text)) {
          scores[id] += 1;
        }
      }
    }
  }

  const sorted = [...archetypeOrder].sort((a, b) => scores[b] - scores[a]);
  const dominant = sorted[0];
  const secondary = sorted[1];
  const total = archetypeOrder.reduce((sum, id) => sum + scores[id], 0) || 1;
  const distribution = Object.fromEntries(
    archetypeOrder.map((id) => [id, Math.round((scores[id] / total) * 100)]),
  ) as Record<ArchetypeId, number>;

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${sessionId}-${Date.now()}`,
    sessionId,
    dominant,
    secondary,
    scores,
    distribution,
    keyPatterns: [...new Set(keyPatterns)].slice(0, 12),
    shadowThemes: [...new Set(shadowThemes)].slice(0, 10),
    dreamSabotageThemes: [...new Set(dreamSabotageThemes)].slice(0, 10),
    protectionThemes: [...new Set(protectionThemes)].slice(0, 10),
    completedAt: new Date().toISOString(),
  };
}
