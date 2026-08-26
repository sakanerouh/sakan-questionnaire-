"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
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
  const locale = useLocale() as AppLocale;
  const t = useTranslations("questionnaire");
  const ui = useTranslations("questionnaireUi");
  const common = useTranslations("common");
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
        body: JSON.stringify({ sessionId, email, answers, locale, completed: false }),
      }).catch(() => undefined);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [answers, email, locale, mounted, sessionId]);

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
        body: JSON.stringify({ sessionId, email, answers, locale, completed: true }),
      });
      const data = (await response.json()) as { result?: SakanResult; error?: string };

      if (!response.ok || !data.result) {
        throw new Error(ui("analysisError"));
      }

      setResult(data.result);
      router.push("/questionnaire/result");
    } catch (error) {
      const message = error instanceof Error ? error.message : ui("analysisError");

      setAnalyzing(false);
      await Swal.fire({
        title: ui("analysisErrorTitle"),
        text: message,
        icon: "warning",
        confirmButtonColor: "#3E4631",
        background: "#FBF9F8",
        color: "#28301C",
      });
    }
  }, [answers, email, locale, router, sessionId, setResult, ui]);

  const next = useCallback(async () => {
    if (valueIsEmpty()) {
      await Swal.fire({
        title: ui("validationTitle"),
        text: ui("validationText"),
        icon: "info",
        confirmButtonColor: "#3E4631",
        background: "#FBF9F8",
        color: "#28301C",
      });
      return;
    }

    if (currentIndex >= questionnaireScreens.length - 1) {
      await finish();
      return;
    }

    setCurrentIndex(currentIndex + 1);
  }, [currentIndex, finish, setCurrentIndex, ui, valueIsEmpty]);

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
            setAnswer(screen.id, option.id);
          } else {
            const currentValue = answers[screen.id];
            const selected = Array.isArray(currentValue) ? currentValue : [];
            setAnswer(
              screen.id,
              selected.includes(option.id)
                ? selected.filter((item) => item !== option.id)
                : [...selected, option.id],
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
      <main className="min-h-screen bg-[#FBF9F8] px-5 py-10 text-[#28301C] sm:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl flex-col items-center justify-center text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#82542A]" aria-hidden />
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-[#82542A]">
            {ui("readingPattern")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            {ui("analyzingTitle")}
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#464840]">
            {ui("analyzingBody")}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#FBF9F8] px-5 py-6 text-[#28301C] sm:px-8">
      <div className="grain" />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <div className="flex items-start gap-4 pt-3">
          <div className="min-w-0 flex-1">
            <ProgressBar
              current={Math.max(questionNumber, 1)}
              total={totalQuestionCount}
              label={t(`sections.${screen.sectionId}`)}
            />
          </div>
          <LanguageSwitcher className="shrink-0" theme="olive" />
        </div>

        <div className="grid flex-1 place-items-center py-12">
          <AnimatePresence mode="wait">
            <motion.div key={screen.id} className="w-full">
              {screen.type === "intro" || screen.type === "insight" ? (
                <SectionIntro
                  eyebrow={t.has(`screens.${screen.id}.eyebrow`) ? t(`screens.${screen.id}.eyebrow`) : undefined}
                  title={t(`screens.${screen.id}.title`)}
                  body={t(`screens.${screen.id}.body`)}
                />
              ) : screen.type === "featured" ? (
                <FeaturedReflectionScreen
                  title={t(`screens.${screen.id}.title`)}
                  body={t(`screens.${screen.id}.body`)}
                  childhoodQuestionId={screen.childhoodQuestionId}
                  sabotageQuestionId={screen.sabotageQuestionId}
                  answers={answers}
                />
              ) : screen.type === "question" ? (
                <QuestionScreen
                  screen={screen}
                  value={answers[screen.id] as string | string[] | undefined}
                  onChange={(value) => setAnswer(screen.id, value)}
                  otherValue={typeof answers[`${screen.id}__other`] === "string" ? answers[`${screen.id}__other`] as string : ""}
                  onOtherChange={(value) => setAnswer(`${screen.id}__other`, value)}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#C6C7BD] py-5">
          <button
            type="button"
            onClick={back}
            aria-keyshortcuts="ArrowLeft PageUp"
            disabled={currentIndex === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#C6C7BD] bg-[#FBF9F8]/70 px-5 text-sm font-semibold text-[#3E4631] transition hover:bg-[#EAE8E7] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {common("back")}
          </button>
          <p className="hidden text-sm text-[#3E4631] sm:block">{ui("progressSaved")}</p>
          <button
            type="button"
            onClick={next}
            aria-keyshortcuts="Enter ArrowRight PageDown"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#3E4631] px-6 text-sm font-semibold text-[#FBF9F8] shadow-[0_18px_45px_rgba(40,48,28,0.18)] transition hover:-translate-y-0.5 hover:bg-[#28301C]"
          >
            {currentIndex >= questionnaireScreens.length - 1 ? ui("seeResult") : common("continue")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </main>
  );
}
