"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { questionnaireScreens, totalQuestionCount } from "@/lib/questionnaire";
import { useQuestionnaireStore } from "@/lib/questionnaireStore";
import type { SakanResult } from "@/lib/schemas";
import { ProgressBar } from "./ProgressBar";
import { QuestionScreen } from "./QuestionScreen";
import { SectionIntro } from "./SectionIntro";
import { FeaturedReflectionScreen } from "./FeaturedReflectionScreen";

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest("input, textarea, select, button, a, [contenteditable='true']"),
  );
};

export function QuestionnaireFlow() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const {
    sessionId,
    email,
    answers,
    currentIndex,
    setAnswer,
    setCurrentIndex,
    setResult,
  } = useQuestionnaireStore();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const screen = questionnaireScreens[currentIndex] ?? questionnaireScreens[0];
  const questionNumber = useMemo(
    () =>
      questionnaireScreens
        .slice(0, currentIndex + 1)
        .filter((item) => item.type === "question").length,
    [currentIndex],
  );

  useEffect(() => {
    if (!mounted) return;

    const timeout = window.setTimeout(() => {
      fetch("/api/questionnaire/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, email, answers, completed: false }),
      }).catch(() => undefined);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [answers, email, mounted, sessionId]);

  const valueIsEmpty = useCallback(() => {
    if (screen.type !== "question" || screen.optional) return false;
    const value = answers[screen.id];
    if (Array.isArray(value)) return value.length === 0;
    return !value || (typeof value === "string" && !value.trim());
  }, [answers, screen]);

  const finish = useCallback(async () => {
    setAnalyzing(true);

    try {
      const response = await fetch("/api/questionnaire/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, email, answers, completed: true }),
      });
      const data = (await response.json()) as { result?: SakanResult; error?: string };

      if (!response.ok || !data.result) {
        throw new Error(data.error || "AI archetype analysis failed.");
      }

      setResult(data.result);
      router.push("/questionnaire/result");
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI archetype analysis failed.";

      setAnalyzing(false);
      await Swal.fire({
        title: "AI analysis did not complete.",
        text: message,
        icon: "warning",
        confirmButtonColor: "#7C3C60",
        background: "#fffaf2",
        color: "#352317",
      });
    }
  }, [answers, email, router, sessionId, setResult]);

  const next = useCallback(async () => {
    if (valueIsEmpty()) {
      await Swal.fire({
        title: "One gentle pause.",
        text: "Choose or write what feels closest before continuing. Optional questions are marked clearly.",
        icon: "info",
        confirmButtonColor: "#7C3C60",
        background: "#fffaf2",
        color: "#352317",
      });
      return;
    }

    if (currentIndex >= questionnaireScreens.length - 1) {
      await finish();
      return;
    }

    setCurrentIndex(currentIndex + 1);
  }, [currentIndex, finish, setCurrentIndex, valueIsEmpty]);

  const back = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, setCurrentIndex]);

  useEffect(() => {
    if (!mounted || analyzing) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const typing = isTypingTarget(event.target);

      if (!typing && screen.type === "question" && screen.questionType !== "text") {
        const optionIndex =
          event.key === "0" ? 9 : /^[1-9]$/.test(event.key) ? Number(event.key) - 1 : -1;
        const option = screen.options?.[optionIndex];

        if (option) {
          event.preventDefault();

          if (screen.questionType === "single") {
            setAnswer(screen.id, option.label);
          } else {
            const currentValue = answers[screen.id];
            const selected = Array.isArray(currentValue) ? currentValue : [];
            setAnswer(
              screen.id,
              selected.includes(option.label)
                ? selected.filter((item) => item !== option.label)
                : [...selected, option.label],
            );
          }

          return;
        }
      }

      if (event.repeat || typing) return;

      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === "Enter") {
        event.preventDefault();
        void next();
      }

      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        back();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [analyzing, answers, back, mounted, next, screen, setAnswer]);

  if (!mounted) {
    return null;
  }

  if (analyzing) {
    return (
      <main className="min-h-screen bg-[#fbf7ef] px-5 py-10 text-[#352317] sm:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl flex-col items-center justify-center text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#A95888]" aria-hidden />
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3C60]">
            Reading the pattern
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            Your answers are being gathered into a mirror.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#6c4b37]">
            Nothing is being diagnosed. We are simply noticing the protection, the
            cost, and the life beginning to come forward.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf7ef] px-5 py-6 text-[#352317] sm:px-8">
      <div className="grain" />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <div className="pt-3">
          <ProgressBar
            current={Math.max(questionNumber, 1)}
            total={totalQuestionCount}
            label={screen.section}
          />
        </div>

        <div className="grid flex-1 place-items-center py-12">
          <AnimatePresence mode="wait">
            <motion.div key={screen.id} className="w-full">
              {screen.type === "intro" || screen.type === "insight" ? (
                <SectionIntro eyebrow={screen.eyebrow} title={screen.title} body={screen.body} />
              ) : screen.type === "featured" ? (
                <FeaturedReflectionScreen
                  title={screen.title}
                  body={screen.body}
                  childhoodQuestionId={screen.childhoodQuestionId}
                  sabotageQuestionId={screen.sabotageQuestionId}
                  answers={answers}
                />
              ) : screen.type === "question" ? (
                <QuestionScreen
                  screen={screen}
                  value={answers[screen.id] as string | string[] | undefined}
                  onChange={(value) => setAnswer(screen.id, value)}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#e4cda9] py-5">
          <button
            type="button"
            onClick={back}
            aria-keyshortcuts="ArrowLeft PageUp"
            disabled={currentIndex === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#DDA8C8]/70 bg-white/50 px-5 text-sm font-semibold text-[#7C3C60] transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </button>
          <p className="hidden text-sm text-[#7C3C60] sm:block">Progress saved automatically</p>
          <button
            type="button"
            onClick={next}
            aria-keyshortcuts="Enter ArrowRight PageDown"
            className="sakan-gradient inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-[#fffaf2] shadow-[0_18px_45px_rgba(124,60,96,0.22)] transition hover:-translate-y-0.5"
          >
            {currentIndex >= questionnaireScreens.length - 1 ? "See My Result" : "Continue"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </main>
  );
}
