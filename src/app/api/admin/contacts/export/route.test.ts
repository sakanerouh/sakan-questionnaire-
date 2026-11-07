import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdmin, recordAdminAudit, getAuditContacts } = vi.hoisted(() => ({
  requireAdmin: vi.fn(), recordAdminAudit: vi.fn(), getAuditContacts: vi.fn(),
}));
vi.mock("@/lib/admin/auth", () => ({ requireAdmin, recordAdminAudit }));
vi.mock("@/lib/admin/contacts.server", () => ({ getAuditContacts }));
vi.mock("@/lib/admin/contacts", async () => import("../../../../../lib/admin/contacts"));

import { GET } from "./route";

describe("contact exports", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAdmin.mockResolvedValue({ userId: "admin" });
    getAuditContacts.mockResolvedValue([{ email: "person@example.com", locale: "en", firstAuditAt: "2026-11-01T00:00:00Z", latestAuditAt: "2026-11-06T00:00:00Z", auditCount: 2, completed: true }]);
  });

  it("rejects unauthenticated/non-admin requests without loading emails", async () => {
    requireAdmin.mockRejectedValue(new Error("ADMIN_UNAUTHORIZED"));
    const response = await GET(new Request("https://example.com/api/admin/contacts/export"));
    expect(response.status).toBe(401);
    expect(getAuditContacts).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("rejects malformed filters before loading contacts", async () => {
    const response = await GET(new Request("https://example.com/api/admin/contacts/export?from=wrong"));
    expect(response.status).toBe(400);
    expect(getAuditContacts).not.toHaveBeenCalled();
  });

  it("exports all filtered contacts and logs counts without storing email/search text in the audit log", async () => {
    const response = await GET(new Request("https://example.com/api/admin/contacts/export?locale=ar&status=completed&q=person"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.text()).toContain("person@example.com");
    expect(getAuditContacts).toHaveBeenCalledWith(expect.objectContaining({ locale: "ar", status: "completed", q: "person" }));
    expect(recordAdminAudit).toHaveBeenCalledWith({ userId: "admin" }, "contacts.export", "contacts", null,
      { row_count: 1, from: null, to: null, locale: "ar", status: "completed" });
  });
});
