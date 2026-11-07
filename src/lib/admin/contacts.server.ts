import "server-only";

import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { buildAuditContacts, contactFiltersSchema, type ContactSession } from "./contacts";

export async function getAuditContacts(input: unknown) {
  await requireAdmin();
  const filters = contactFiltersSchema.parse(input);
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const sessions: ContactSession[] = [];
  const batchSize = 500;
  for (let offset = 0; ; offset += batchSize) {
    // Fail visibly instead of silently exporting only a subset of contacts.
    if (offset >= 50000) throw new Error("Too many audit sessions. Narrow the date or language filters.");
    let query = supabase.from("anonymous_sessions")
      .select("email, locale, created_at, questionnaire_responses(completed)")
      .not("email", "is", null)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + batchSize - 1);
    if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00.000Z`);
    if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59.999Z`);
    if (filters.locale !== "all") query = query.eq("locale", filters.locale);
    const { data, error } = await query;
    if (error) throw new Error("Audit contacts could not be loaded. Please try again.");
    sessions.push(...(data ?? []));
    if (!data || data.length < batchSize) break;
  }
  return buildAuditContacts(sessions, filters);
}
