import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdmin, getSupabaseAdmin } = vi.hoisted(() => ({ requireAdmin: vi.fn(), getSupabaseAdmin: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin/auth", () => ({ requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin }));

import { getAuditContacts } from "./contacts.server";

function database(pages: { data: unknown; error: unknown }[]) {
  const query = {
    select: vi.fn().mockReturnThis(), not: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    then(resolve: (value: unknown) => unknown) { return Promise.resolve(pages.shift()).then(resolve); },
  };
  getSupabaseAdmin.mockReturnValue({ from: vi.fn(() => query) });
  return query;
}

describe("protected contact loading", () => {
  beforeEach(() => { vi.resetAllMocks(); requireAdmin.mockResolvedValue({ userId: "admin" }); });

  it("checks active admin access before touching the service client", async () => {
    requireAdmin.mockRejectedValue(new Error("ADMIN_UNAUTHORIZED"));
    await expect(getAuditContacts({})).rejects.toThrow("ADMIN_UNAUTHORIZED");
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("fetches subsequent database pages rather than silently cutting the export at the API limit", async () => {
    const session = { email: "one@example.com", locale: "en", created_at: "2026-11-01T10:00:00Z", questionnaire_responses: [{ completed: true }] };
    const query = database([
      { data: Array.from({ length: 500 }, () => session), error: null },
      { data: [{ ...session, email: "two@example.com" }], error: null },
    ]);
    const contacts = await getAuditContacts({ from: "2026-11-01", to: "2026-11-07", locale: "en" });
    expect(contacts).toHaveLength(2);
    expect(contacts.find((contact) => contact.email === "one@example.com")?.auditCount).toBe(500);
    expect(query.range.mock.calls).toEqual([[0, 499], [500, 999]]);
    expect(query.select).toHaveBeenCalledWith("email, locale, created_at, questionnaire_responses(completed)");
    expect(query.gte).toHaveBeenCalledWith("created_at", "2026-11-01T00:00:00.000Z");
    expect(query.lte).toHaveBeenCalledWith("created_at", "2026-11-07T23:59:59.999Z");
    expect(query.eq).toHaveBeenCalledWith("locale", "en");
  });

  it("fails visibly on database errors", async () => {
    database([{ data: null, error: { message: "unavailable" } }]);
    await expect(getAuditContacts({})).rejects.toThrow("could not be loaded");
  });
});
