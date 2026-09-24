import "server-only";

import type { AppLocale } from "@/i18n/routing";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  BUNDLED_QUESTIONNAIRE_VERSION_ID,
  bundledQuestionnairePayload,
  bundledQuestionnaireSnapshot,
  questionnairePayloadSchema,
  type QuestionnaireSnapshot,
} from "./questionnaireSnapshot";

type VersionRow = {
  id: string;
  version_number: number | null;
  status: "draft" | "published" | "archived";
  definition: unknown;
  translations: unknown;
  change_summary?: string | null;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
};

const rowToSnapshot = (row: VersionRow): QuestionnaireSnapshot => {
  const payload = questionnairePayloadSchema.parse({
    screens: row.definition,
    translations: row.translations,
  });
  return {
    id: row.id,
    versionNumber: row.version_number ?? 0,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    changeSummary: row.change_summary,
    ...payload,
  };
};

async function fetchVersion(id: string): Promise<QuestionnaireSnapshot | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("questionnaire_versions")
    .select(
      "id, version_number, status, definition, translations, change_summary, created_at, updated_at, published_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToSnapshot(data as VersionRow);
}

export async function ensureQuestionnaireSeeded(): Promise<QuestionnaireSnapshot | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data: settings, error: settingsError } = await supabase
    .from("questionnaire_settings")
    .select("published_version_id")
    .eq("singleton", true)
    .maybeSingle();

  if (settingsError) return null;
  if (settings?.published_version_id) {
    return fetchVersion(settings.published_version_id);
  }

  const now = new Date().toISOString();
  const publishedValues = {
    id: BUNDLED_QUESTIONNAIRE_VERSION_ID,
    version_number: 1,
    status: "published",
    definition: bundledQuestionnairePayload.screens,
    translations: bundledQuestionnairePayload.translations,
    change_summary: "Initial bundled questionnaire",
    published_at: now,
    updated_at: now,
  };
  const { error: publishedError } = await supabase
    .from("questionnaire_versions")
    .upsert(publishedValues, { onConflict: "id", ignoreDuplicates: true });
  if (publishedError) return null;

  const { error: settingsWriteError } = await supabase
    .from("questionnaire_settings")
    .upsert({ singleton: true, published_version_id: BUNDLED_QUESTIONNAIRE_VERSION_ID, updated_at: now });
  if (settingsWriteError) return null;

  const { data: draft } = await supabase
    .from("questionnaire_versions")
    .select("id")
    .eq("status", "draft")
    .maybeSingle();
  if (!draft) {
    await supabase.from("questionnaire_versions").insert({
      status: "draft",
      definition: bundledQuestionnairePayload.screens,
      translations: bundledQuestionnairePayload.translations,
      base_version_id: BUNDLED_QUESTIONNAIRE_VERSION_ID,
    });
  }

  return fetchVersion(BUNDLED_QUESTIONNAIRE_VERSION_ID);
}

export async function getPublishedQuestionnaireSnapshot(): Promise<QuestionnaireSnapshot> {
  return (await ensureQuestionnaireSeeded()) ?? bundledQuestionnaireSnapshot;
}

export async function getQuestionnaireSnapshotById(
  id: string | null | undefined,
): Promise<QuestionnaireSnapshot> {
  if (!id || id === BUNDLED_QUESTIONNAIRE_VERSION_ID) {
    return (await fetchVersion(BUNDLED_QUESTIONNAIRE_VERSION_ID)) ?? bundledQuestionnaireSnapshot;
  }
  return (await fetchVersion(id)) ?? getPublishedQuestionnaireSnapshot();
}

export async function getQuestionnaireSnapshotForSession(
  sessionId: string,
  locale: AppLocale,
): Promise<QuestionnaireSnapshot> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return bundledQuestionnaireSnapshot;

  const published = await getPublishedQuestionnaireSnapshot();
  const { data: session, error } = await supabase
    .from("anonymous_sessions")
    .select("questionnaire_version_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) return published;
  const assignedId = session?.questionnaire_version_id as string | null | undefined;
  if (assignedId) return getQuestionnaireSnapshotById(assignedId);

  const { error: assignmentError } = await supabase.from("anonymous_sessions").upsert({
    id: sessionId,
    locale,
    questionnaire_version_id: published.id,
    updated_at: new Date().toISOString(),
  });
  if (assignmentError) return published;

  return published;
}

