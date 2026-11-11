"use client";

import type { SupportedLocale } from "@/lib/schemas";
import { useQuestionnaireStore } from "@/lib/questionnaireStore";
import type { AuditAccessState } from "./types";

let initialization: Promise<AuditAccessState> | null = null;

export async function auditRequest<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Please try again.");
  return data as T;
}

export function applyAuditState(state: AuditAccessState) {
  const current = useQuestionnaireStore.getState();
  const changed = state.sessionId !== current.sessionId;
  if (changed && !state.created) {
    useQuestionnaireStore.setState({ sessionId: state.sessionId, email: state.email,
      answers: state.answers ?? {}, currentIndex: 0, restoredScreenId: state.currentScreenId ?? undefined,
      questionnaireVersionId: state.questionnaireVersionId, result: state.result });
  } else {
    useQuestionnaireStore.setState({ sessionId: state.sessionId, email: state.email || current.email,
      ...(changed ? { result: undefined } : {}) });
  }
}

export function initializeAuditClient(locale: SupportedLocale) {
  // Strict Mode and overlapping page mounts share one initialization. Cookie
  // creation cannot race and create two payable audits in the same browser.
  if (!initialization) {
    initialization = (async () => {
      await useQuestionnaireStore.persist.rehydrate();
      const state = await auditRequest<AuditAccessState>("/api/questionnaire/access", {
        sessionId: useQuestionnaireStore.getState().sessionId, locale,
      });
      applyAuditState(state);
      return state;
    })().finally(() => { initialization = null; });
  }
  return initialization;
}
