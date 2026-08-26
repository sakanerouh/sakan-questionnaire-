"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useQuestionnaireStore } from "@/lib/questionnaireStore";
import type { SakanResult } from "@/lib/schemas";
import { ResultTeaser } from "./ResultTeaser";

export function ResultPageClient() {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const t = useTranslations("resultUi");
  const [mounted, setMounted] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { sessionId, email, answers, result, setResult } = useQuestionnaireStore();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!Object.keys(answers).length) {
      router.replace("/questionnaire/start");
      return;
    }

    if (result) return;

    let cancelled = false;

    const analyze = async () => {
      try {
        const response = await fetch("/api/questionnaire/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, email, answers, locale, completed: true }),
        });
        const data = (await response.json()) as { result?: SakanResult; error?: string };

        if (!response.ok || !data.result) {
          throw new Error(t("preparing"));
        }

        if (!cancelled) {
          setResult(data.result);
        }
      } catch (error) {
        if (!cancelled) {
          setAnalysisError(
            error instanceof Error ? error.message : t("preparing"),
          );
        }
      }
    };

    void analyze();

    return () => {
      cancelled = true;
    };
  }, [answers, email, locale, mounted, result, router, sessionId, setResult, t]);

  if (!mounted || !result) {
    return (
      <main className="min-h-screen bg-[#FBF9F8] px-5 py-10 text-[#28301C] sm:px-8">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] place-items-center">
          <p className="max-w-xl text-center text-lg leading-8 text-[#464840]">
            {analysisError ?? t("preparing")}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBF9F8] px-5 py-8 text-[#28301C] sm:px-8">
      <div className="grain" />
      <div className="mx-auto mb-8 flex max-w-6xl items-center justify-between gap-4">
        <Link
          href="/questionnaire/start"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#464840]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("returnToAnswers")}
        </Link>
        <LanguageSwitcher theme="olive" />
      </div>
      <ResultTeaser result={result} />
    </main>
  );
}
