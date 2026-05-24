"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useQuestionnaireStore } from "@/lib/questionnaireStore";
import type { SakanResult } from "@/lib/schemas";
import { ResultTeaser } from "./ResultTeaser";

export function ResultPageClient() {
  const router = useRouter();
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
          body: JSON.stringify({ sessionId, email, answers, completed: true }),
        });
        const data = (await response.json()) as { result?: SakanResult; error?: string };

        if (!response.ok || !data.result) {
          throw new Error(data.error || "AI archetype analysis failed.");
        }

        if (!cancelled) {
          setResult(data.result);
        }
      } catch (error) {
        if (!cancelled) {
          setAnalysisError(
            error instanceof Error ? error.message : "AI archetype analysis failed.",
          );
        }
      }
    };

    void analyze();

    return () => {
      cancelled = true;
    };
  }, [answers, email, mounted, result, router, sessionId, setResult]);

  if (!mounted || !result) {
    return (
      <main className="min-h-screen bg-[#fbf7ef] px-5 py-10 text-[#352317] sm:px-8">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] place-items-center">
          <p className="max-w-xl text-center text-lg leading-8 text-[#6c4b37]">
            {analysisError ?? "Preparing your AI archetype result..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] px-5 py-8 text-[#352317] sm:px-8">
      <div className="grain" />
      <div className="mx-auto mb-8 flex max-w-6xl items-center justify-between">
        <Link
          href="/questionnaire/start"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#6c4b37]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Return to answers
        </Link>
      </div>
      <ResultTeaser result={result} />
    </main>
  );
}
