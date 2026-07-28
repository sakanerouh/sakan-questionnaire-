"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Answers, SakanResult } from "./schemas";
import { migrateLegacyAnswers, QUESTIONNAIRE_STATE_VERSION } from "./questionnaireMigration";

type QuestionnaireState = {
  sessionId: string;
  email: string;
  answers: Answers;
  currentIndex: number;
  result?: SakanResult;
  setEmail: (email: string) => void;
  setAnswer: (id: string, value: string | string[]) => void;
  setCurrentIndex: (index: number) => void;
  setResult: (result: SakanResult) => void;
  reset: () => void;
};

type PersistedQuestionnaireState = Pick<
  QuestionnaireState,
  "sessionId" | "email" | "answers" | "currentIndex" | "result"
>;

const createSessionId = () =>
  globalThis.crypto?.randomUUID?.() ?? `sakan-${Date.now()}`;

export const useQuestionnaireStore = create<QuestionnaireState>()(
  persist<QuestionnaireState, [], [], PersistedQuestionnaireState>(
    (set) => ({
      sessionId: createSessionId(),
      email: "",
      answers: {},
      currentIndex: 0,
      setEmail: (email) => set({ email }),
      setAnswer: (id, value) =>
        set((state) => ({ answers: { ...state.answers, [id]: value } })),
      setCurrentIndex: (currentIndex) => set({ currentIndex }),
      setResult: (result) => set({ result }),
      reset: () =>
        set({
          sessionId: createSessionId(),
          email: "",
          answers: {},
          currentIndex: 0,
          result: undefined,
        }),
    }),
    {
      name: "sakanbody-audit-progress",
      version: QUESTIONNAIRE_STATE_VERSION,
      migrate: (persistedState) => {
        const state = persistedState as PersistedQuestionnaireState | undefined;
        return {
          ...state,
          answers: migrateLegacyAnswers(state?.answers ?? {}),
        } as PersistedQuestionnaireState;
      },
      partialize: (state) => ({
        sessionId: state.sessionId,
        email: state.email,
        answers: state.answers,
        currentIndex: state.currentIndex,
        result: state.result,
      }),
    },
  ),
);

export const reportStorageKey = (id: string) => `sakanbody-report-${id}`;
