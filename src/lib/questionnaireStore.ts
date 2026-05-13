"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Answers, SakanResult } from "./schemas";

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

const createSessionId = () =>
  globalThis.crypto?.randomUUID?.() ?? `sakan-${Date.now()}`;

export const useQuestionnaireStore = create<QuestionnaireState>()(
  persist(
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
