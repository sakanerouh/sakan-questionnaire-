import { setRequestLocale } from "next-intl/server";
import { normalizeLocale } from "@/i18n/routing";
import { AuditCheckout } from "@/components/questionnaire/AuditCheckout";

export const metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function ResumePage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(normalizeLocale((await params).locale));
  return <AuditCheckout step="resume" price={null} />;
}
