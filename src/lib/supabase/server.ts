import { createClient } from "@supabase/supabase-js";

const hasRealValue = (value: string | undefined): value is string =>
  Boolean(value?.trim()) && !value?.toLowerCase().includes("your_");

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasRealValue(url) || !hasRealValue(key)) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
