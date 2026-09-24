import { QuestionnaireEditor } from "@/components/admin/QuestionnaireEditor";
import { normalizeLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/admin/auth";
import { getAdminQuestionnaireState } from "@/lib/admin/questionnaire";
import { connection } from "next/server";

export default async function AdminQuestionnairePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await connection();
  await requireAdminPage(normalizeLocale((await params).locale));
  const state = await getAdminQuestionnaireState();
  return (
    <main className="mx-auto max-w-[1500px] px-5 py-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#82542A]">Questionnaire</p>
      <h1 className="mt-2 font-serif text-4xl">Bilingual content editor</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#464840]">
        Edit wording, optional status, and ordering without changing protected IDs, question types, or scoring weights. Save privately, preview both languages, then publish.
      </p>
      <QuestionnaireEditor initialDraft={state.draft} initialVersions={state.versions} />
    </main>
  );
}
