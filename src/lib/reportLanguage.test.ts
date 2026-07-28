import { describe, expect, it } from "vitest";
import { reportLanguageInstruction } from "./reportLocale";

describe("AI report language", () => {
  it("requests natural French for French completion", () => {
    expect(reportLanguageInstruction("fr")).toContain("French");
    expect(reportLanguageInstruction("fr")).toContain("vous");
  });

  it("requests English for English completion", () => {
    expect(reportLanguageInstruction("en")).toContain("English");
  });
});
