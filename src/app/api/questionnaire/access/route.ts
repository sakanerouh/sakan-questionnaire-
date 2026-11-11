import { z } from "zod";
import { initializeAudit, setAuditCookie } from "@/lib/audit/access";
import { auditErrorResponse, privateJson, requireAuditOrigin } from "@/lib/audit/http";
import { localeSchema } from "@/lib/schemas";

const input = z.object({ sessionId: z.string().min(1).max(200), locale: localeSchema.default("en") });

export async function POST(request: Request) {
  try {
    requireAuditOrigin(request);
    const parsed = input.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Invalid audit request." }, { status: 400 });
    const { state, token } = await initializeAudit(request, parsed.data.sessionId, parsed.data.locale);
    const response = privateJson(state);
    if (token) setAuditCookie(response, token);
    return response;
  } catch (error) { return auditErrorResponse(error); }
}
