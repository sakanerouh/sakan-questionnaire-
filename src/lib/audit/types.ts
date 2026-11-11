import type { Answers, SakanResult } from "@/lib/schemas";

export type AuditAccessState = {
  sessionId: string;
  email: string;
  flow: "pre_audit" | "post_audit";
  granted: boolean;
  paymentStatus: "paid" | "demo_unlocked" | null;
  created?: boolean;
  answers?: Answers;
  currentScreenId?: string | null;
  questionnaireVersionId?: string;
  result?: SakanResult;
  transferPending?: boolean;
};

export type AuditPrice = { amount: number; currency: string } | null;

export function formatAuditPrice(price: AuditPrice, locale: string) {
  if (!price) return null;
  return new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "en", {
    style: "currency", currency: price.currency,
  }).format(price.amount);
}
