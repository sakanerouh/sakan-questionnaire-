import { NextResponse } from "next/server";

export class AuditError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function auditErrorResponse(error: unknown) {
  return NextResponse.json({ ok: false, error: error instanceof AuditError ? error.message : "Audit access is temporarily unavailable. Please try again.",
    code: error instanceof AuditError && error.status === 402 ? "PAYMENT_REQUIRED" : undefined,
  }, { status: error instanceof AuditError ? error.status : 503, headers: { "Cache-Control": "private, no-store" } });
}

export function requireAuditOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    throw new AuditError(403, "Invalid request origin.");
  }
}

export function privateJson(value: unknown) {
  return NextResponse.json(value, { headers: { "Cache-Control": "private, no-store" } });
}
