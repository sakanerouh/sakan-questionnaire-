export class AdminRequestError extends Error {
  constructor() {
    super("ADMIN_INVALID_ORIGIN");
  }
}

/**
 * Cookie-authenticated mutations must originate from this deployment. Supabase
 * cookies are SameSite=Lax, but this explicit check keeps the API safe if cookie
 * defaults or hosting behavior change later.
 */
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    throw new AdminRequestError();
  }
}

export function adminRequestStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "ADMIN_UNAUTHORIZED") return 401;
  if (message === "ADMIN_INVALID_ORIGIN") return 403;
  return 400;
}

export function adminRequestMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (message === "ADMIN_UNAUTHORIZED") return "Unauthorized.";
  if (message === "ADMIN_INVALID_ORIGIN") return "Invalid request origin.";
  return message;
}
