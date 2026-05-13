"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useQuestionnaireStore } from "@/lib/questionnaireStore";
import { calculateResult } from "@/lib/scoring";
import { ResultTeaser } from "./ResultTeaser";

export function ResultPageClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { sessionId, answers, result, setResult } = useQuestionnaireStore();

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

    if (!result) {
      setResult(calculateResult(sessionId, answers));
    }
  }, [answers, mounted, result, router, sessionId, setResult]);

  if (!mounted || !result) {
    return (
      <main className="min-h-screen bg-[#fbf7ef] px-5 py-10 text-[#352317] sm:px-8">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] place-items-center">
          <p className="text-lg text-[#6c4b37]">Preparing your result...</p>
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
      <ResultTeaser result={result} answers={answers} />
    </main>
  );
}
