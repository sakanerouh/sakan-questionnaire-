import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queryResult } from "@/test/queryResult";
const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), db: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: mocks.db }));
import { AUDIT_COOKIE, cookieSessionId, initializeAudit, requireAuditAccess, requireReportAccess, tokenHash } from "./access";

const token = "a".repeat(64);
const request = (credential = false) => new Request("https://example.com/api", { headers: credential ? { cookie: `${AUDIT_COOKIE}=${token}` } : {} });
describe("server audit access", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.db.mockReturnValue({ from: mocks.from, rpc: mocks.rpc }); });
  afterEach(() => vi.unstubAllEnvs());
  it.each([false, true])("reads cookies after a POST body was consumed (credential: %s)", async (credential) => {
    const incoming = new Request("https://example.com/api/checkout", {
      method: "POST", headers: credential ? { cookie: `${AUDIT_COOKIE}=${token}` } : {},
      body: JSON.stringify({ sessionId: "audit" }),
    });
    await incoming.json();
    mocks.from.mockReturnValue(queryResult({ session_id: "audit" }));
    expect(await cookieSessionId(incoming)).toBe(credential ? "audit" : null);
    if (credential) expect(mocks.from).toHaveBeenCalledWith("audit_access_tokens");
    else expect(mocks.from).not.toHaveBeenCalled();
  });
  it("fails closed when storage is missing", async () => {
    mocks.db.mockReturnValue(null); await expect(requireAuditAccess(request(), "audit")).rejects.toMatchObject({ status: 503 });
  });
  it("does not treat an arbitrary or local-only session ID as a free audit", async () => {
    mocks.from.mockReturnValue(queryResult(null)); await expect(requireAuditAccess(request(), "invented")).rejects.toMatchObject({ status: 402 });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("preserves legacy audit behavior without granting that mode to new sessions", async () => {
    mocks.from.mockReturnValue(queryResult({ id: "legacy", payment_flow: "post_audit" }));
    expect((await requireAuditAccess(request(), "legacy")).session.id).toBe("legacy");
  });
  it("requires the opaque cookie for a prepaid session", async () => {
    mocks.from.mockReturnValue(queryResult({ id: "audit", payment_flow: "pre_audit" }));
    await expect(requireAuditAccess(request(), "audit")).rejects.toMatchObject({ status: 401 });
  });
  it("rejects a credential for another audit", async () => {
    mocks.from.mockImplementation((table) => queryResult(table === "anonymous_sessions" ? { id: "audit", payment_flow: "pre_audit" } : { session_id: "other" }));
    await expect(requireAuditAccess(request(true), "audit")).rejects.toMatchObject({ status: 401 });
  });
  it("requires payment even with a valid browser credential", async () => {
    mocks.from.mockImplementation((table) => queryResult(table === "anonymous_sessions" ? { id: "audit", payment_flow: "pre_audit" } : table === "audit_access_tokens" ? { session_id: "audit" } : []));
    await expect(requireAuditAccess(request(true), "audit")).rejects.toMatchObject({ status: 402 });
  });
  it("admits a verified paid session", async () => {
    mocks.from.mockImplementation((table) => queryResult(table === "anonymous_sessions" ? { id: "audit", payment_flow: "pre_audit" } : table === "audit_access_tokens" ? { session_id: "audit" } : [{ status: "paid" }]));
    expect((await requireAuditAccess(request(true), "audit")).paymentStatus).toBe("paid");
  });
  it("does not honor demo grants in production", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("ENABLE_DEMO_UNLOCK", "true");
    mocks.from.mockImplementation((table) => queryResult(table === "anonymous_sessions" ? { id: "audit", payment_flow: "pre_audit" } : table === "audit_access_tokens" ? { session_id: "audit" } : [{ status: "demo_unlocked" }]));
    await expect(requireAuditAccess(request(true), "audit")).rejects.toMatchObject({ status: 402 });
  });
  it("rejects legacy demo reports outside explicitly enabled development", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("ENABLE_DEMO_UNLOCK", "true");
    await expect(requireReportAccess(request(), "legacy", "demo_unlocked")).rejects.toMatchObject({ status: 402 });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("creates a server ID and stores a hash rather than the browser token", async () => {
    mocks.from.mockImplementation((table) => queryResult(table === "anonymous_sessions" ? mocks.rpc.mock.calls.length ? { id: "created", payment_flow: "pre_audit" } : null : []));
    mocks.rpc.mockResolvedValue({ error: null });
    const initialized = await initializeAudit(request(), "local-only", "ar");
    expect(initialized.state.created).toBe(true); expect(initialized.state.granted).toBe(false);
    expect(mocks.rpc).toHaveBeenCalledWith("audit_create_session", expect.objectContaining({ p_token_hash: tokenHash(initialized.token!), p_locale: "ar" }));
    expect(initialized.state.sessionId).not.toBe("local-only");
  });
});
