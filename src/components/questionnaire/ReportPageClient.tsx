"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Sparkles } from "lucide-react";
import { archetypes } from "@/lib/archetypes";
import { buildReportBlocks, type ReportBlock } from "@/lib/report";
import { reportStorageKey, useQuestionnaireStore } from "@/lib/questionnaireStore";
import type { Answers, SakanResult } from "@/lib/schemas";
import { ArchetypeChart } from "./ArchetypeChart";
import { PracticeCard } from "./PracticeCard";
import { ReportSection } from "./ReportSection";

type StoredReport = {
  answers: Answers;
  result: SakanResult;
};

type LoadedReport = {
  blocks: ReportBlock[];
  result: SakanResult;
};

type ReportApiResponse = {
  report?: LoadedReport;
};

export function ReportPageClient({ id }: { id: string }) {
  const { answers, result: storeResult } = useQuestionnaireStore();
  const [report, setReport] = useState<LoadedReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadReport = async () => {
      try {
        const raw = window.localStorage.getItem(reportStorageKey(id));
        if (raw) {
          const stored = JSON.parse(raw) as StoredReport;
          setReport({
            result: stored.result,
            blocks: buildReportBlocks(stored.answers, stored.result),
          });
          return;
        }

        if (storeResult?.id === id) {
          setReport({
            result: storeResult,
            blocks: buildReportBlocks(answers, storeResult),
          });
          return;
        }

        const response = await fetch(`/api/report/${encodeURIComponent(id)}`);
        if (!response.ok) return;

        const data = (await response.json()) as ReportApiResponse;
        if (!cancelled && data.report) {
          setReport(data.report);
        }
      } catch {
        setReport(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const frame = window.requestAnimationFrame(loadReport);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [answers, id, storeResult]);

  const blocks = useMemo(() => report?.blocks ?? [], [report]);

  if (loading || !report) {
    return (
      <main className="min-h-screen bg-[#fbf7ef] px-5 py-10 text-[#352317] sm:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl flex-col items-center justify-center text-center">
          <Sparkles className="h-10 w-10 text-[#A95888]" aria-hidden />
          <h1 className="mt-6 text-4xl font-semibold">
            {loading ? "Opening your report..." : "Report not found."}
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#6c4b37]">
            {loading
              ? "We are checking this browser and your saved Supabase report."
              : "Complete the questionnaire first, or check that Supabase is configured locally."}
          </p>
          {!loading && (
            <Link
              href="/questionnaire/start"
              className="sakan-gradient mt-8 inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold text-[#fffaf2]"
            >
              Begin the questionnaire
            </Link>
          )}
        </div>
      </main>
    );
  }

  const dominant = archetypes[report.result.dominant];
  const secondary = archetypes[report.result.secondary];

  return (
    <main className="min-h-screen bg-[#fbf7ef] px-5 py-8 text-[#352317] sm:px-8">
      <div className="grain" />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/questionnaire/result"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6c4b37]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to teaser
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#DDA8C8]/70 bg-white/50 px-5 text-sm font-semibold text-[#7C3C60] opacity-70"
            title="PDF download can be wired next."
          >
            <Download className="h-4 w-4" aria-hidden />
            PDF later
          </button>
        </div>

        <section className="sakan-gradient-deep rounded-[8px] border border-[#DDA8C8]/45 p-6 text-[#fffaf2] shadow-[0_28px_80px_rgba(124,60,96,0.28)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f8d7ea]">
            SakanBody Audit Report
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">
            {dominant.name}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#f8ead7]">
            {dominant.short} Your secondary pattern is {secondary.name}, creating a
            nuanced blend of protection and becoming.
          </p>
        </section>

        <div className="mt-6 rounded-[8px] border border-[#e4cda9] bg-[#fffaf2]/78 p-5">
          <ArchetypeChart distribution={report.result.distribution} />
        </div>

        <div className="mt-6 grid gap-5">
          {blocks.map((block) =>
            block.title === "Personalized Practices" ? (
              <section
                key={block.title}
                className="rounded-[8px] border border-[#e4cda9] bg-[#fffaf2]/78 p-6 shadow-[0_18px_55px_rgba(75,47,32,0.08)] sm:p-8"
              >
                <h2 className="text-2xl font-semibold text-[#352317]">{block.title}</h2>
                <p className="mt-4 text-base leading-8 text-[#5d402d]">{block.body}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {block.bullets?.map((practice) => (
                    <PracticeCard key={practice} practice={practice} />
                  ))}
                </div>
              </section>
            ) : (
              <ReportSection key={block.title} block={block} />
            ),
          )}
        </div>
      </div>
    </main>
  );
}
