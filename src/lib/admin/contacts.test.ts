import { describe, expect, it } from "vitest";
import { buildAuditContacts, contactFiltersSchema, contactsToCsv, type ContactSession } from "./contacts";

const sessions: ContactSession[] = [
  { email: " Sara@Example.com ", locale: "en", created_at: "2026-11-01T10:00:00Z", questionnaire_responses: [{ completed: false }] },
  { email: "sara@example.com", locale: "ar", created_at: "2026-11-06T10:00:00Z", questionnaire_responses: [{ completed: true }] },
  { email: "other@example.com", locale: "en", created_at: "2026-11-05T10:00:00Z", questionnaire_responses: [] },
  ...[null, "", "   ", "invalid"].map((email) => ({ email, locale: "en", created_at: "2026-11-01T10:00:00Z", questionnaire_responses: [] })),
];

describe("audit contact lists", () => {
  it("groups repeat emails case-insensitively, excludes missing/invalid emails and uses the latest language", () => {
    const contacts = buildAuditContacts(sessions, contactFiltersSchema.parse({}));
    expect(contacts).toHaveLength(2);
    expect(contacts[0]).toEqual({ email: "sara@example.com", locale: "ar", auditCount: 2, completed: true,
      firstAuditAt: "2026-11-01T10:00:00Z", latestAuditAt: "2026-11-06T10:00:00Z" });
  });

  it("filters status after grouping, so someone with a completed audit is excluded from in-progress-only", () => {
    expect(buildAuditContacts(sessions, contactFiltersSchema.parse({ status: "in_progress" })).map((row) => row.email)).toEqual(["other@example.com"]);
    expect(buildAuditContacts(sessions, contactFiltersSchema.parse({ q: "SARA", status: "completed" }))).toHaveLength(1);
    expect(buildAuditContacts(sessions, contactFiltersSchema.parse({ q: "missing" }))).toEqual([]);
  });

  it.each([{ from: "not-a-date" }, { from: "2026-02-30" }, { from: "2026-11-07", to: "2026-11-01" }, { locale: "xx" }])("rejects invalid filters %j", (filters) => {
    expect(contactFiltersSchema.safeParse(filters).success).toBe(false);
  });

  it("exports only contact metadata and never infers marketing permission", () => {
    const csv = contactsToCsv(buildAuditContacts(sessions, contactFiltersSchema.parse({})));
    expect(csv).toContain('"marketing_consent"');
    expect(csv.match(/sara@example.com/g)).toHaveLength(1);
    expect(csv).toContain('"not_recorded"');
    expect(csv).not.toMatch(/session_id|answer|dominant|payment|report/);
  });

  it("neutralizes spreadsheet formulas even in valid email addresses", () => {
    const contacts = buildAuditContacts([{ ...sessions[0], email: "+sales@example.com" }], contactFiltersSchema.parse({}));
    expect(contactsToCsv(contacts)).toContain('"\'+sales@example.com"');
  });
});
