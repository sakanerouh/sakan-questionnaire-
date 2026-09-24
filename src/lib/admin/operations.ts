import "server-only";

import { createHash } from "node:crypto";
import type { AppLocale } from "@/i18n/routing";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type OperationsFilters = {
  from?: string;
  to?: string;
  locale?: AppLocale | "all";
  limit?: number;
};

export type OperationRow = {
  participantRef: string;
  locale: string;
  startedAt: string;
  updatedAt: string;
  completed: boolean;
  currentScreenId: string | null;
  dominant: string | null;
  secondary: string | null;
  paymentStatus: string;
  amount: number | null;
  currency: string | null;
  reportStatus: string;
};

const participantRef = (sessionId: string) =>
  createHash("sha256").update(sessionId).digest("hex").slice(0, 12).toUpperCase();

const applyDateFilters = <T>(query: T, from?: string, to?: string) => {
  let filtered = query as T & {
    gte: (column: string, value: string) => typeof filtered;
    lte: (column: string, value: string) => typeof filtered;
  };
  if (from) filtered = filtered.gte("created_at", `${from}T00:00:00.000Z`);
  if (to) filtered = filtered.lte("created_at", `${to}T23:59:59.999Z`);
  return filtered;
};

export async function getOperationsData(filters: OperationsFilters = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 5000);
  const fromTimestamp = filters.from ? `${filters.from}T00:00:00.000Z` : null;
  const toTimestamp = filters.to ? `${filters.to}T23:59:59.999Z` : null;
  const { data: metricRows } = await supabase.rpc("admin_operations_metrics", {
    p_from: fromTimestamp,
    p_to: toTimestamp,
    p_locale: filters.locale && filters.locale !== "all" ? filters.locale : null,
  });

  let sessionsQuery = supabase
    .from("anonymous_sessions")
    .select("id, locale, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  sessionsQuery = applyDateFilters(sessionsQuery, filters.from, filters.to);
  if (filters.locale && filters.locale !== "all") {
    sessionsQuery = sessionsQuery.eq("locale", filters.locale);
  }
  const { data: sessions, error: sessionsError } = await sessionsQuery;
  if (sessionsError) throw new Error("Operational sessions could not be loaded.");

  const sessionIds = (sessions ?? []).map((session) => session.id);
  if (!sessionIds.length) {
    return {
      metrics: { starts: 0, completions: 0, completionRate: 0, paid: 0, conversionRate: 0, revenue: 0, currency: "eur", reportFailures: 0, english: 0, french: 0 },
      rows: [] as OperationRow[],
      truncated: false,
    };
  }

  const [{ data: responses }, { data: payments }, { data: reports }, { data: results }] =
    await Promise.all([
      supabase.from("questionnaire_responses").select("session_id, completed, current_screen_id, updated_at").in("session_id", sessionIds).order("updated_at", { ascending: false }),
      supabase.from("payments").select("session_id, status, amount_total, currency, created_at").in("session_id", sessionIds).order("created_at", { ascending: false }),
      supabase.from("reports").select("session_id, payment_status, generation_status, updated_at").in("session_id", sessionIds).order("updated_at", { ascending: false }),
      supabase.from("archetype_results").select("session_id, dominant, secondary, created_at").in("session_id", sessionIds).order("created_at", { ascending: false }),
    ]);

  const responseMap = new Map<string, NonNullable<typeof responses>[number]>();
  for (const response of responses ?? []) if (!responseMap.has(response.session_id)) responseMap.set(response.session_id, response);
  const paymentMap = new Map<string, (typeof payments extends (infer U)[] | null ? U : never)>();
  for (const payment of payments ?? []) if (!paymentMap.has(payment.session_id)) paymentMap.set(payment.session_id, payment);
  const reportMap = new Map<string, NonNullable<typeof reports>[number]>();
  for (const report of reports ?? []) if (!reportMap.has(report.session_id)) reportMap.set(report.session_id, report);
  const resultMap = new Map<string, NonNullable<typeof results>[number]>();
  for (const result of results ?? []) if (!resultMap.has(result.session_id)) resultMap.set(result.session_id, result);

  const rows: OperationRow[] = (sessions ?? []).map((session) => {
    const response = responseMap.get(session.id);
    const payment = paymentMap.get(session.id);
    const report = reportMap.get(session.id);
    const result = resultMap.get(session.id);
    return {
      participantRef: participantRef(session.id),
      locale: session.locale,
      startedAt: session.created_at,
      updatedAt: response?.updated_at ?? session.updated_at,
      completed: Boolean(response?.completed),
      currentScreenId: response?.current_screen_id ?? null,
      dominant: result?.dominant ?? null,
      secondary: result?.secondary ?? null,
      paymentStatus: payment?.status ?? report?.payment_status ?? "not_started",
      amount: payment?.amount_total ?? null,
      currency: payment?.currency ?? null,
      reportStatus: report?.generation_status ?? "not_started",
    };
  });

  const completions = rows.filter((row) => row.completed).length;
  const paidRows = rows.filter((row) => row.paymentStatus === "paid");
  const metric = Array.isArray(metricRows) ? metricRows[0] : metricRows;
  const starts = Number(metric?.starts ?? rows.length);
  const paid = Number(metric?.paid ?? paidRows.length);
  const metricCompletions = Number(metric?.completions ?? completions);
  const revenue = Number(metric?.revenue ?? paidRows.reduce((sum, row) => sum + (row.amount ?? 0), 0));
  const currency = metric?.currency ?? paidRows.find((row) => row.currency)?.currency ?? "eur";
  return {
    metrics: {
      starts,
      completions: metricCompletions,
      completionRate: starts ? Math.round((metricCompletions / starts) * 100) : 0,
      paid,
      conversionRate: starts ? Math.round((paid / starts) * 100) : 0,
      revenue,
      currency,
      reportFailures: Number(metric?.report_failures ?? rows.filter((row) => row.reportStatus === "failed").length),
      english: Number(metric?.english ?? rows.filter((row) => row.locale === "en").length),
      french: Number(metric?.french ?? rows.filter((row) => row.locale === "fr").length),
    },
    rows,
    truncated: rows.length === limit,
  };
}
