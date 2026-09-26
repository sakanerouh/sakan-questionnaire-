const hasRealValue = (value: string | undefined): value is string =>
  Boolean(value?.trim()) && !value?.toLowerCase().includes("your_");

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!hasRealValue(url) || !hasRealValue(publishableKey)) return null;
  return { url, publishableKey };
}

