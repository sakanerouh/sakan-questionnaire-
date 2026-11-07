import { z } from "zod";

export const contactFiltersSchema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  locale: z.enum(["all", "en", "fr", "ar"]).default("all"),
  status: z.enum(["all", "completed", "in_progress"]).default("all"),
  q: z.string().trim().max(254).default(""),
}).refine((filters) => !filters.from || !filters.to || filters.from <= filters.to, {
  message: "The end date must be on or after the start date.",
});

export type ContactFilters = z.infer<typeof contactFiltersSchema>;
export type ContactSession = {
  email: string | null;
  locale: string;
  created_at: string;
  questionnaire_responses: { completed: boolean }[];
};
export type AuditContact = {
  email: string;
  locale: string;
  firstAuditAt: string;
  latestAuditAt: string;
  auditCount: number;
  completed: boolean;
};

export function contactFilterInput(params: URLSearchParams) {
  return Object.fromEntries(["from", "to", "locale", "status", "q"]
    .map((key) => [key, params.get(key) || undefined]));
}

export function contactQueryParams(filters: ContactFilters) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.locale !== "all") params.set("locale", filters.locale);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  return params;
}

export function buildAuditContacts(sessions: ContactSession[], filters: ContactFilters): AuditContact[] {
  const contacts = new Map<string, AuditContact>();
  for (const session of sessions) {
    const email = session.email?.trim().toLowerCase();
    if (!email || !z.email().safeParse(email).success) continue;
    const completed = session.questionnaire_responses.some((response) => response.completed);
    const existing = contacts.get(email);
    if (existing) {
      existing.auditCount += 1;
      existing.completed ||= completed;
      if (session.created_at < existing.firstAuditAt) existing.firstAuditAt = session.created_at;
      if (session.created_at > existing.latestAuditAt) {
        existing.latestAuditAt = session.created_at;
        existing.locale = session.locale;
      }
    } else {
      contacts.set(email, {
        email, locale: session.locale, firstAuditAt: session.created_at,
        latestAuditAt: session.created_at, auditCount: 1, completed,
      });
    }
  }
  const search = filters.q.toLowerCase();
  return [...contacts.values()]
    .filter((contact) => contact.email.includes(search)
      && (filters.status === "all" || contact.completed === (filters.status === "completed")))
    .sort((a, b) => b.latestAuditAt.localeCompare(a.latestAuditAt) || a.email.localeCompare(b.email));
}

export function contactsToCsv(contacts: AuditContact[]) {
  const cell = (value: unknown) => {
    const raw = String(value ?? "");
    const safe = /^\s*[=+\-@]/.test(raw) || /^[\t\r\n]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return [
    ["email", "language", "first_audit_at", "latest_audit_at", "audit_count", "completed", "marketing_consent"],
    ...contacts.map((contact) => [contact.email, contact.locale, contact.firstAuditAt,
      contact.latestAuditAt, contact.auditCount, contact.completed, "not_recorded"]),
  ].map((row) => row.map(cell).join(",")).join("\r\n");
}
