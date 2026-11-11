import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ admin: vi.fn(), rpc: vi.fn(), link: vi.fn() }));
vi.mock("@/lib/admin/auth", () => ({ requireAdmin: mocks.admin }));
vi.mock("@/lib/admin/payments", () => ({ issueAuditLink: mocks.link }));
vi.mock("@/lib/audit/access", () => ({ auditDatabase: () => ({ rpc: mocks.rpc }) }));
import { POST } from "./route";

const paymentId = "00000000-0000-4000-8000-000000000001";
const request = (body: unknown, origin = "https://example.com") => new Request("https://example.com/api/admin/payments", {
  method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body),
});
describe("admin bank-transfer approval", () => {
  beforeEach(() => {
    vi.resetAllMocks(); mocks.admin.mockResolvedValue({ userId: "admin" });
    mocks.rpc.mockResolvedValue({ data: "audit", error: null }); mocks.link.mockResolvedValue("https://example.com/en/questionnaire/resume#token=secret");
  });
  it("rejects non-admins without touching payments", async () => {
    mocks.admin.mockRejectedValue(new Error("ADMIN_UNAUTHORIZED"));
    expect((await POST(request({ action: "approve", paymentId, amount: 12000, currency: "mad", reference: "BANK" }))).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.link).not.toHaveBeenCalled();
  });
  it("rejects cross-origin approval", async () => {
    expect((await POST(request({}, "https://attacker.example"))).status).toBe(403); expect(mocks.admin).not.toHaveBeenCalled();
  });
  it.each([0, -1, 1.5])("rejects invalid received amount %s", async (amount) => {
    expect((await POST(request({ action: "approve", paymentId, amount, currency: "mad", reference: "BANK" }))).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("records actual received funds and provides the manual-delivery link", async () => {
    const response = await POST(request({ action: "approve", paymentId, amount: 12000, currency: "mad", reference: "BANK" }));
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.rpc).toHaveBeenCalledWith("audit_approve_transfer", { p_payment_id: paymentId, p_actor: "admin", p_amount: 12000, p_currency: "mad", p_reference: "BANK" });
    expect(mocks.link).toHaveBeenCalledWith("audit", { userId: "admin" }, "https://example.com");
  });
  it("can issue a replacement link without recording another payment", async () => {
    expect((await POST(request({ action: "link", sessionId: "audit" }))).status).toBe(200); expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
