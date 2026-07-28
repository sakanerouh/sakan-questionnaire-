import { redirect } from "@/i18n/navigation";
import { normalizeLocale } from "@/i18n/routing";

export default async function QuestionnairePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = normalizeLocale((await params).locale);
  redirect({ href: "/questionnaire/start", locale });
}
