import { describe, expect, it } from "vitest";
import { calculateResult } from "./scoring";
import {
  bundledQuestionnairePayload,
  validateQuestionnairePayload,
} from "./questionnaireSnapshot";

const copyPayload = () => structuredClone(bundledQuestionnairePayload);

describe("safe questionnaire versions", () => {
  it("accepts the bundled bilingual questionnaire", () => {
    const payload = validateQuestionnairePayload(copyPayload());
    expect(payload.screens.filter((screen) => screen.type === "question")).toHaveLength(55);
    expect(payload.screens.filter((screen) => screen.type === "intro")).toHaveLength(9);
    expect(payload.screens.filter((screen) => screen.type === "featured")).toHaveLength(1);
  });

  it("allows wording, optional status, screen order, and choice order changes", () => {
    const payload = copyPayload();
    payload.translations.en.screens["why-now"].prompt = "Updated safe wording";
    const question = payload.screens.find((screen) => screen.id === "family-role");
    if (!question || question.type !== "question") throw new Error("Missing fixture question");
    question.optional = true;
    question.options = [...(question.options ?? [])].reverse();
    const from = payload.screens.findIndex((screen) => screen.id === "age");
    const [age] = payload.screens.splice(from, 1);
    payload.screens.splice(from + 1, 0, age);
    expect(() => validateQuestionnairePayload(payload)).not.toThrow();
  });

  it("rejects protected scoring, IDs, and incomplete translations", () => {
    const weighted = copyPayload();
    const question = weighted.screens.find((screen) => screen.id === "family-role");
    if (!question || question.type !== "question" || !question.options?.[0]) {
      throw new Error("Missing fixture question");
    }
    question.options[0].weights = { performer: 99 };
    expect(() => validateQuestionnairePayload(weighted)).toThrow(/scoring weights/i);

    const missingCopy = copyPayload();
    missingCopy.translations.fr.screens["why-now"].prompt = "";
    expect(() => validateQuestionnairePayload(missingCopy)).toThrow(/Missing FR prompt/);

    const renamed = copyPayload();
    renamed.screens[0].id = "renamed-screen";
    expect(() => validateQuestionnairePayload(renamed)).toThrow(/Unknown screen ID/);
  });

  it("rejects moving a featured reflection before its dependencies", () => {
    const payload = copyPayload();
    const index = payload.screens.findIndex((screen) => screen.type === "featured");
    const [featured] = payload.screens.splice(index, 1);
    payload.screens.unshift(featured);
    expect(() => validateQuestionnairePayload(payload)).toThrow(/must appear before featured/);
  });

  it("keeps scoring unchanged after safe copy-only edits", () => {
    const payload = copyPayload();
    payload.translations.en.screens["family-role"].prompt = "Changed display copy";
    const answers = { "family-role": ["the_responsible_one", "the_peacemaker"] };
    const before = calculateResult("before", answers);
    const after = calculateResult("after", answers, "en", payload.screens);
    expect(after.scores).toEqual(before.scores);
    expect(after.distribution).toEqual(before.distribution);
  });
});
