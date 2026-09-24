import { describe, expect, it } from "vitest";
import { operationsCsvHeaders, operationsToCsv } from "./operationsExport";

describe("privacy-safe operations export", () => {
  it("does not define email, session ID, or answer columns", () => {
    expect(operationsCsvHeaders.join(" ")).not.toMatch(/email|session_id|answer/i);
  });

  it("exports only anonymized operational fields and safely escapes cells", () => {
    const csv = operationsToCsv([
      {
        participantRef: "ABC123",
        locale: "en",
        startedAt: "2026-08-27T10:00:00.000Z",
        updatedAt: "2026-08-27T10:10:00.000Z",
        completed: true,
        currentScreenId: "closing-recognition",
        dominant: "anticipator",
        secondary: "harmonizer",
        paymentStatus: "paid",
        amount: 1100,
        currency: "eur",
        reportStatus: "ready",
      },
    ]);
    expect(csv).toContain('"ABC123"');
    expect(csv).not.toMatch(/@|answers/i);
  });

  it("neutralizes spreadsheet formulas in exported text", () => {
    const csv = operationsToCsv([
      {
        participantRef: "ABC123",
        locale: "en",
        startedAt: "2026-08-27T10:00:00.000Z",
        updatedAt: "2026-08-27T10:10:00.000Z",
        completed: false,
        currentScreenId: "=HYPERLINK(\"https://attacker.example\")",
        dominant: null,
        secondary: null,
        paymentStatus: "not_started",
        amount: null,
        currency: null,
        reportStatus: "not_started",
      },
    ]);

    expect(csv).toContain("'=HYPERLINK");
    expect(csv).not.toContain('\",\"=HYPERLINK');
  });
});
