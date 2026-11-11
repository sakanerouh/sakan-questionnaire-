import { z } from "zod";
import { requireAuditAccess } from "@/lib/audit/access";
import { AuditError, auditErrorResponse, privateJson, requireAuditOrigin } from "@/lib/audit/http";
import { preparePayment } from "@/lib/audit/payments";
import { localeSchema } from "@/lib/schemas";
import { nextStepsWhatsAppUrl } from "@/content/nextSteps";

export async function POST(request: Request) {
  try {
    requireAuditOrigin(request);
    const input = z.object({ sessionId: z.string().min(1), email: z.string().trim().email(), locale: localeSchema.default("en") })
      .safeParse(await request.json().catch(() => null));
    if (!input.success) throw new AuditError(400, "Enter a valid email address.");
    const { sessionId, email, locale } = input.data;
    const { session, paymentStatus } = await requireAuditAccess(request, sessionId, false);
    if (session.payment_flow !== "pre_audit") throw new AuditError(400, "This payment option is for new audits.");
    if (paymentStatus) return privateJson({ granted: true });
    const payment = await preparePayment(sessionId, "bank_transfer", email);
    if (payment.grants_access) return privateJson({ granted: true });
    const reference = payment.id;
    const message = locale === "ar"
      ? `مرحبًا، أودّ الدفع بالتحويل البنكي مقابل SakanBody Audit. أرجو إرسال بيانات التحويل والمبلغ بالدرهم.\nالبريد الإلكتروني: ${email}\nمرجع الدفع: ${reference}`
      : `Hello, I would like to pay for my SakanBody Audit by bank transfer. Please send the transfer details and amount in MAD.\nEmail: ${email}\nPayment reference: ${reference}`;
    return privateJson({ reference, url: nextStepsWhatsAppUrl(message) });
  } catch (error) { return auditErrorResponse(error); }
}
