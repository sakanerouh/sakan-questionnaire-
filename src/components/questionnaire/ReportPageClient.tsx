"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, Loader2, Sparkles } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import {
  isGeneratedReport,
  type GeneratedReport,
  type ReportContent,
} from "@/lib/generatedReport";
import { normalizeProtectiveRoleCopy } from "@/lib/protectiveRoleCopy";
import type { SakanResult } from "@/lib/schemas";
import { ArchetypeChart } from "./ArchetypeChart";
import { PracticeCard } from "./PracticeCard";
import { ReportSection } from "./ReportSection";

type LoadedReport = {
  content: ReportContent | null;
  contentSource: string;
  generationError?: string | null;
  generationStatus: string;
  paymentStatus: string;
  result: SakanResult;
};

type ReportApiResponse = {
  report?: LoadedReport;
};

function GeneratingReportPanel({
  error,
  generating,
  onRetry,
}: {
  error?: string | null;
  generating: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations("reportUi");
  const steps = t.raw("steps") as string[];

  return (
    <section className="mt-6 overflow-hidden rounded-[8px] border border-[#e4cda9] bg-[#fffaf2]/78 p-6 shadow-[0_18px_55px_rgba(75,47,32,0.08)] sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DDA8C8]/70 bg-white/58 px-4 py-2 text-sm font-semibold text-[#7C3C60]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t("writing")}
          </div>
          <h2 className="mt-5 text-3xl font-semibold text-[#352317]">
            {t("writingTitle")}
          </h2>
          <p className="mt-4 text-base leading-8 text-[#5d402d]">
            {t("writingBody")}
          </p>
          {error && (
            <p className="mt-4 rounded-[8px] border border-[#DDA8C8]/60 bg-white/60 p-4 text-sm font-semibold leading-6 text-[#A95888]">
              {error}
            </p>
          )}
        </div>
        <div className="grid min-h-36 w-full max-w-sm place-items-center rounded-[8px] border border-[#ead5e2] bg-white/58">
          <div className="relative h-24 w-24">
            <div className="absolute inset-0 rounded-full border-4 border-[#eadbc5]" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#A95888]" />
            <Sparkles className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-[#7C3C60]" />
          </div>
        </div>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step}
            className="rounded-[8px] border border-[#ead5e2] bg-white/58 p-4 text-sm font-semibold text-[#6c4b37]"
          >
            {step}
          </div>
        ))}
      </div>
      {error && (
        <button
          type="button"
          onClick={onRetry}
          disabled={generating}
          className="sakan-gradient mt-6 inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#fffaf2] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("retry")}
        </button>
      )}
    </section>
  );
}

export function ReportPageClient({ id }: { id: string }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("reportUi");
  const roles = useTranslations("archetypes");
  const mountedRef = useRef(true);
  const [report, setReport] = useState<LoadedReport | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationAttempted, setGenerationAttempted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const fetchReport = useCallback(
    async ({ quiet = false }: { quiet?: boolean } = {}) => {
      if (!quiet) {
        setLoading(true);
      }

      try {
        const response = await fetch(`/api/report/${encodeURIComponent(id)}?locale=${locale}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as ReportApiResponse;

        if (mountedRef.current && data.report) {
          setReport(data.report);
        }

        return data.report ?? null;
      } catch {
        if (mountedRef.current && !quiet) {
          setReport(null);
        }

        return null;
      } finally {
        if (mountedRef.current && !quiet) {
          setLoading(false);
        }
      }
    },
    [id, locale],
  );

  const generateReport = useCallback(async () => {
    setGenerating(true);
    setReport((current) =>
      current
        ? {
            ...current,
            generationError: null,
            generationStatus: "generating",
          }
        : current,
    );

    try {
      const response = await fetch(`/api/report/${encodeURIComponent(id)}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = (await response.json()) as {
        content?: GeneratedReport;
        error?: string;
      };

      if (!response.ok || !data.content) {
        throw new Error(t("generationError"));
      }

      const content = data.content;

      setReport((current) =>
        current
          ? {
              ...current,
              content,
              contentSource: "ai",
              generationError: null,
              generationStatus: "ready",
            }
          : current,
      );
    } catch (error) {
      const latest = await fetchReport({ quiet: true });

      if (
        latest &&
        latest.contentSource !== "fallback" &&
        isGeneratedReport(latest.content)
      ) {
        return;
      }

      const message = error instanceof Error ? error.message : t("generationError");

      setReport((current) =>
        current
          ? {
              ...current,
              generationError: message,
              generationStatus: "failed",
            }
          : current,
      );
    } finally {
      setGenerating(false);
      setGenerationAttempted(true);
      void fetchReport({ quiet: true });
    }
  }, [fetchReport, id, locale, t]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void fetchReport();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [fetchReport]);

  const generatedContent = useMemo(
    () =>
      report && report.contentSource !== "fallback" && isGeneratedReport(report.content)
        ? report.content
        : null,
    [report],
  );
  const unlocked = report
    ? ["paid", "demo_unlocked"].includes(report.paymentStatus)
    : false;

  useEffect(() => {
    if (!report || generatedContent || !unlocked || generating || generationAttempted) {
      return;
    }

    if (report.generationStatus === "failed") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      void generateReport();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [
    generateReport,
    generatedContent,
    generating,
    generationAttempted,
    report,
    unlocked,
  ]);

  useEffect(() => {
    if (!report || generatedContent || !unlocked || report.generationStatus === "failed") {
      return;
    }

    const shouldPoll =
      generating ||
      generationAttempted ||
      report.generationStatus === "generating" ||
      report.generationStatus === "ready";

    if (!shouldPoll) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchReport({ quiet: true });
    }, 2500);

    return () => window.clearInterval(interval);
  }, [
    fetchReport,
    generatedContent,
    generating,
    generationAttempted,
    report,
    unlocked,
  ]);

  if (loading || !report) {
    return (
      <main className="min-h-screen bg-[#fbf7ef] px-5 py-10 text-[#352317] sm:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl flex-col items-center justify-center text-center">
          <Sparkles className="h-10 w-10 text-[#A95888]" aria-hidden />
          <h1 className="mt-6 text-4xl font-semibold">
            {loading ? t("openingReport") : t("notFound")}
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#6c4b37]">
            {loading
              ? t("checking")
              : t("notFoundBody")}
          </p>
          {!loading && (
            <Link
              href="/questionnaire/start"
              className="sakan-gradient mt-8 inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold text-[#fffaf2]"
            >
              {t("begin")}
            </Link>
          )}
        </div>
      </main>
    );
  }

  const dominantName = roles(`${report.result.dominant}.name`);
  const secondaryName = roles(`${report.result.secondary}.name`);
  const pdfAvailable = Boolean(generatedContent);
  const downloadPdf = async () => {
    if (!pdfAvailable || downloadingPdf) return;

    setDownloadingPdf(true);
    setPdfError(null);

    try {
      const response = await fetch(`/api/report/${encodeURIComponent(id)}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: report.content,
          result: report.result,
          locale,
        }),
      });

      if (!response.ok) {
        throw new Error(t("pdfError"));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sakanbody-report-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : t("pdfError"));
    } finally {
      setDownloadingPdf(false);
    }
  };

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
            {t("back")}
          </Link>
          <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={downloadPdf}
            disabled={!pdfAvailable || downloadingPdf}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#DDA8C8]/70 bg-white/50 px-5 text-sm font-semibold text-[#7C3C60] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            {downloadingPdf ? t("preparingPdf") : t("downloadPdf")}
          </button>
          </div>
        </div>
        {pdfError && (
          <p className="-mt-4 mb-6 text-right text-sm font-semibold text-[#A95888]">
            {pdfError}
          </p>
        )}

        <section className="sakan-gradient-deep rounded-[8px] border border-[#DDA8C8]/45 p-6 text-[#fffaf2] shadow-[0_28px_80px_rgba(124,60,96,0.28)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f8d7ea]">
            {t("reportEyebrow")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">
            {generatedContent
              ? normalizeProtectiveRoleCopy(generatedContent.reportTitle)
              : dominantName}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#f8ead7]">
            {generatedContent
              ? normalizeProtectiveRoleCopy(generatedContent.reportSubtitle)
              : t("fallbackSubtitle", { dominant: roles(`${report.result.dominant}.short`), secondary: secondaryName })}
          </p>
        </section>

        <div className="mt-6 rounded-[8px] border border-[#e4cda9] bg-[#fffaf2]/78 p-5">
          <ArchetypeChart scores={report.result.scores} />
        </div>

        {!generatedContent && unlocked && (
          <GeneratingReportPanel
            error={report.generationStatus === "failed" ? report.generationError : null}
            generating={generating}
            onRetry={generateReport}
          />
        )}

        {!generatedContent && !unlocked && report.paymentStatus !== "local" && (
          <section className="mt-6 rounded-[8px] border border-[#e4cda9] bg-[#fffaf2]/78 p-6 shadow-[0_18px_55px_rgba(75,47,32,0.08)] sm:p-8">
            <h2 className="text-2xl font-semibold text-[#352317]">{t("lockedTitle")}</h2>
            <p className="mt-4 text-base leading-8 text-[#5d402d]">
              {t("lockedBody")}
            </p>
          </section>
        )}

        <div className="mt-6 grid gap-5">
          {generatedContent && (
            <>
              <ReportSection
                block={{
                  title: t("openingLetter"),
                  body: normalizeProtectiveRoleCopy(generatedContent.openingLetter),
                }}
              />
              {generatedContent.blocks.map((block) => (
                <section
                  key={block.title}
                  className="rounded-[8px] border border-[#e4cda9] bg-[#fffaf2]/78 p-6 shadow-[0_18px_55px_rgba(75,47,32,0.08)] sm:p-8"
                >
                  <h2 className="text-2xl font-semibold text-[#352317]">
                    {normalizeProtectiveRoleCopy(block.title)}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-[#5d402d]">
                    {normalizeProtectiveRoleCopy(block.body)}
                  </p>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3C60]">
                        {t("reflection")}
                      </h3>
                      <ul className="mt-3 grid gap-3">
                        {block.reflectionPrompts.map((prompt) => (
                          <li
                            key={prompt}
                            className="rounded-[8px] bg-white/58 p-4 text-sm leading-6 text-[#6c4b37]"
                          >
                            {normalizeProtectiveRoleCopy(prompt)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3C60]">
                        {t("practices")}
                      </h3>
                      <div className="mt-3 grid gap-3">
                        {block.practices.map((practice) => (
                          <PracticeCard
                            key={practice}
                            practice={normalizeProtectiveRoleCopy(practice)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ))}
              <section className="rounded-[8px] border border-[#e4cda9] bg-[#fffaf2]/78 p-6 shadow-[0_18px_55px_rgba(75,47,32,0.08)] sm:p-8">
                <h2 className="text-2xl font-semibold text-[#352317]">
                  {t("sevenDayPlan")}
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {generatedContent.sevenDayPlan.map((item) => (
                    <div
                      key={`${item.day}-${item.title}`}
                      className="rounded-[8px] border border-[#e4cda9] bg-white/58 p-5"
                    >
                      <p className="text-sm font-semibold text-[#7C3C60]">
                        {t("day", { day: item.day })}: {normalizeProtectiveRoleCopy(item.title)}
                      </p>
                      <p className="mt-3 text-base leading-7 text-[#5d402d]">
                        {normalizeProtectiveRoleCopy(item.practice)}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[#6c4b37]">
                        {normalizeProtectiveRoleCopy(item.reflection)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm leading-6 text-[#6c4b37]">
                  {normalizeProtectiveRoleCopy(generatedContent.disclaimer)}
                </p>
              </section>
            </>
          )}

        </div>
      </div>
    </main>
  );
}
