import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ access: vi.fn(), snapshot: vi.fn(), generate: vi.fn(), db: vi.fn() }));
vi.mock("@/lib/audit/access", () => ({ requireAuditAccess: mocks.access, resultFromRow: vi.fn() }));
vi.mock("@/lib/questionnaireRepository", () => ({ getQuestionnaireSnapshotForSession: mocks.snapshot }));
vi.mock("@/lib/aiReportGenerator", () => ({ generateAiResult: mocks.generate }));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: mocks.db }));
import { GET } from "./definition/route";
import { POST } from "./session/route";
import { AuditError } from "@/lib/audit/http";

describe("questionnaire API payment gates", () => {
  beforeEach(() => vi.resetAllMocks());
  it.each([401, 402, 503])("does not serve content or invoke analysis when access returns %s", async (status) => {
    mocks.access.mockRejectedValue(new AuditError(status, "Access denied"));
    expect((await GET(new Request("https://example.com/api/questionnaire/definition?sessionId=audit&locale=en"))).status).toBe(status);
    const save = () => new Request("https://example.com/api/questionnaire/session", { method: "POST", headers: { origin: "https://example.com", "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "audit", answers: {}, completed: true, locale: "en" }) });
    expect((await POST(save())).status).toBe(status);
    expect(mocks.snapshot).not.toHaveBeenCalled(); expect(mocks.generate).not.toHaveBeenCalled(); expect(mocks.db).not.toHaveBeenCalled();
  });
});
