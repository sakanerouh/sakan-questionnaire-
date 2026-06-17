export type SupabaseErrorLike = {
  code?: string;
  details?: string;
  message?: string;
};

export const databaseErrorMessage = (
  fallback: string,
  error: SupabaseErrorLike,
) => [fallback, error.message, error.details, error.code].filter(Boolean).join(" ");

export const isSupabaseUnavailable = (error: SupabaseErrorLike) =>
  [error.message, error.details, error.code]
    .filter(Boolean)
    .some((value) => /fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT/i.test(value ?? ""));

export const supabaseUnavailableMessage =
  "Supabase is unreachable. Check the production SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and project status before retrying checkout.";
