import { describe, expect, it, vi } from "vitest";
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import { preservePathAndSearch } from "../i18n/path";
import { questionnaireScreens } from "./questionnaire";
import { LEGACY_ANSWER_LABELS, migrateLegacyAnswers } from "./questionnaireMigration";
import { calculateResult } from "./scoring";
import { localeSchema, sessionPayloadSchema } from "./schemas";

describe("localized presentation", () => {
  it("contains complete English and French landing content", () => {
    expect(en.landing.heroTitle).toContain("pattern");
    expect(fr.landing.heroTitle).toContain("schéma");
    expect(en.landing.faqs).toHaveLength(fr.landing.faqs.length);
  });

  it("resolves both display languages from the same stable question and option IDs", () => {
    const question = questionnaireScreens.find((screen) => screen.id === "family-role");
    expect(question?.type).toBe("question");
    if (!question || question.type !== "question") return;
    expect(question.options?.[0].id).toBe("the_responsible_one");
    expect(en.questionnaire.screens["family-role"].options.the_responsible_one).toBe("The responsible one");
    expect(fr.questionnaire.screens["family-role"].options.the_responsible_one).not.toBe("The responsible one");
  });

  it("preserves route and query parameters during locale switching", () => {
    expect(preservePathAndSearch("/questionnaire/start", "step=4&from=email")).toBe(
      "/questionnaire/start?step=4&from=email",
    );
  });

  it("has no untranslated English questionnaire values except shared words", () => {
    const same: string[] = [];
    const walk = (left: unknown, right: unknown) => {
      if (typeof left === "string" && typeof right === "string") {
        if (left === right) same.push(left);
        return;
      }
      if (left && right && typeof left === "object" && typeof right === "object") {
        for (const key of Object.keys(left)) {
          walk((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]);
        }
      }
    };
    walk(en.questionnaire, fr.questionnaire);
    expect(same).toEqual(expect.arrayContaining(["Orientation", "Discipline"]));
    expect(same).toHaveLength(2);
  });
});

describe("stable questionnaire answers", () => {
  it("uses IDs for every selectable answer", () => {
    for (const screen of questionnaireScreens) {
      if (screen.type !== "question") continue;
      for (const option of screen.options ?? []) {
        expect(option.id).toMatch(/^[a-z0-9_]+$/);
        expect(option).not.toHaveProperty("label");
      }
    }
  });

  it("scores single and multiple stable IDs without display text", () => {
    const single = calculateResult("single", { "life-window": "im_25_30_and_just_starting_to_feel_the_clash" });
    const multi = calculateResult("multi", { "family-role": ["the_responsible_one", "the_peacemaker"] });
    expect(single.sessionId).toBe("single");
    expect(multi.scores.performer).toBeGreaterThan(0);
    expect(multi.scores.harmonizer).toBeGreaterThan(0);
  });

  it("produces identical scoring regardless of locale", () => {
    const answers = { "family-role": ["the_responsible_one", "the_peacemaker"] };
    expect(calculateResult("a", answers, "en").scores).toEqual(calculateResult("b", answers, "fr").scores);
  });
});

describe("legacy answer migration", () => {
  it("maps every known English option label to its stable ID and is idempotent", () => {
    const migrated = migrateLegacyAnswers({ "family-role": ["The responsible one", "The peacemaker"] });
    expect(migrated["family-role"]).toEqual(["the_responsible_one", "the_peacemaker"]);
    expect(migrateLegacyAnswers(migrated)).toEqual(migrated);
    expect(LEGACY_ANSWER_LABELS["family-role"]["Other"]).toBe("other");
  });

  it("preserves free text and unknown legacy values safely", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const migrated = migrateLegacyAnswers({
      "why-now": "These are my exact words.",
      "family-role": ["A custom older answer"],
    });
    expect(migrated["why-now"]).toBe("These are my exact words.");
    expect(migrated["family-role"]).toEqual(["A custom older answer"]);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});

describe("locale validation", () => {
  it("accepts supported locales and safely falls back for invalid legacy values", () => {
    expect(localeSchema.safeParse("fr").success).toBe(true);
    const payload = sessionPayloadSchema.parse({ sessionId: "s", answers: {}, locale: "xx" });
    expect(payload.locale).toBe("en");
  });
});
