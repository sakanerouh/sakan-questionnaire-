import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { ensureQuestionnaireSeeded } from "@/lib/questionnaireRepository";
import {
  questionnairePayloadSchema,
  validateQuestionnairePayload,
  type QuestionnairePayload,
  type QuestionnaireSnapshot,
} from "@/lib/questionnaireSnapshot";
import { recordAdminAudit, type CurrentAdmin } from "./auth";

type VersionRow = {
  id: string;
  version_number: number | null;
  status: "draft" | "published" | "archived";
  definition: unknown;
  translations: unknown;
  change_summary: string | null;
  base_version_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

const toSnapshot = (row: VersionRow): QuestionnaireSnapshot => ({
  id: row.id,
  versionNumber: row.version_number ?? 0,
  status: row.status,
  changeSummary: row.change_summary,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  publishedAt: row.published_at,
  ...questionnairePayloadSchema.parse({
    screens: row.definition,
    translations: row.translations,
  }),
});

export type QuestionnaireVersionSummary = {
  id: string;
  versionNumber: number;
  status: "published" | "archived";
  changeSummary: string | null;
  publishedAt: string | null;
  author: string;
};

export async function getAdminQuestionnaireState() {
  await ensureQuestionnaireSeeded();
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const [{ data: draft, error: draftError }, { data: versions, error: versionsError }, { data: admins }] =
    await Promise.all([
      supabase
        .from("questionnaire_versions")
        .select("*")
        .eq("status", "draft")
        .maybeSingle(),
      supabase
        .from("questionnaire_versions")
        .select("*")
        .in("status", ["published", "archived"])
        .order("version_number", { ascending: false })
        .limit(30),
      supabase.from("admin_users").select("user_id, email, display_name"),
    ]);

  if (draftError || versionsError || !draft) {
    throw new Error("Questionnaire administration tables are not initialized.");
  }

  const names = new Map(
    (admins ?? []).map((item) => [
      item.user_id,
      item.display_name?.trim() || item.email,
    ]),
  );
  return {
    draft: toSnapshot(draft as VersionRow),
    versions: ((versions ?? []) as VersionRow[]).map((version) => ({
      id: version.id,
      versionNumber: version.version_number ?? 0,
      status: version.status as "published" | "archived",
      changeSummary: version.change_summary,
      publishedAt: version.published_at,
      author: names.get(version.updated_by ?? version.created_by ?? "") ?? "System",
    } satisfies QuestionnaireVersionSummary)),
  };
}

export async function saveQuestionnaireDraft(
  admin: CurrentAdmin,
  input: unknown,
): Promise<QuestionnaireSnapshot> {
  const payload = validateQuestionnairePayload(input);
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("questionnaire_versions")
    .update({
      definition: payload.screens,
      translations: payload.translations,
      updated_by: admin.userId,
      updated_at: now,
    })
    .eq("status", "draft")
    .select("*")
    .single();
  if (error || !data) throw new Error("The draft could not be saved.");
  await recordAdminAudit(admin, "questionnaire.draft.save", "questionnaire_version", data.id, {
    screen_count: payload.screens.length,
  });
  return toSnapshot(data as VersionRow);
}

export async function publishQuestionnaireDraft(
  admin: CurrentAdmin,
  changeSummary: string,
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: draft, error: draftError } = await supabase
    .from("questionnaire_versions")
    .select("id, definition, translations")
    .eq("status", "draft")
    .single();
  if (draftError || !draft) throw new Error("Questionnaire draft not found.");
  validateQuestionnairePayload({ screens: draft.definition, translations: draft.translations });
  const { data, error } = await supabase.rpc("publish_questionnaire_draft", {
    p_draft_id: draft.id,
    p_actor: admin.userId,
    p_change_summary: changeSummary.trim() || "Questionnaire content update",
  });
  if (error || !data) throw new Error(error?.message ?? "The draft could not be published.");
  return data as string;
}

export async function rollbackQuestionnaireVersion(
  admin: CurrentAdmin,
  versionId: string,
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: target, error: targetError } = await supabase
    .from("questionnaire_versions")
    .select("id, version_number, definition, translations")
    .eq("id", versionId)
    .in("status", ["published", "archived"])
    .single();
  if (targetError || !target) throw new Error("The selected version was not found.");
  const payload: QuestionnairePayload = validateQuestionnairePayload({
    screens: target.definition,
    translations: target.translations,
  });
  const { data: draft, error: draftError } = await supabase
    .from("questionnaire_versions")
    .update({
      definition: payload.screens,
      translations: payload.translations,
      base_version_id: target.id,
      updated_by: admin.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("status", "draft")
    .select("id")
    .single();
  if (draftError || !draft) throw new Error("The rollback draft could not be prepared.");
  const { data: publishedId, error: publishError } = await supabase.rpc(
    "publish_questionnaire_draft",
    {
      p_draft_id: draft.id,
      p_actor: admin.userId,
      p_change_summary: `Rollback to version ${target.version_number}`,
    },
  );
  if (publishError || !publishedId) throw new Error("The rollback could not be published.");
  await recordAdminAudit(admin, "questionnaire.rollback", "questionnaire_version", publishedId, {
    restored_version_id: target.id,
    restored_version_number: target.version_number,
  });
  return publishedId as string;
}

