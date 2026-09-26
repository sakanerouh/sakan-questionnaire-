import { NextResponse } from "next/server";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { archetypeOrder, archetypes } from "@/lib/archetypes";
import {
  generatedReportSchema,
  legacyReportBlockSchema,
  reportContentSchema,
  type GeneratedReport,
  type LegacyReportBlock,
  type ReportContent,
} from "@/lib/generatedReport";
import { normalizeProtectiveRoleCopy, roleScoreValue } from "@/lib/protectiveRoleCopy";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getDictionary, localizedArchetype } from "@/lib/localizedQuestionnaire";
import { localeSchema, type SupportedLocale } from "@/lib/schemas";

export const runtime = "nodejs";

const unlockedStatuses = new Set(["paid", "demo_unlocked"]);

const resultRowSchema = z.object({
  dominant: z.enum(["anticipator", "performer", "harmonizer", "quiter"]),
  secondary: z.enum(["anticipator", "performer", "harmonizer", "quiter"]),
  scores: z.record(z.string(), z.number()).default({}),
  distribution: z.record(z.string(), z.number()),
});

type PdfResult = z.infer<typeof resultRowSchema>;

const pdfPayloadSchema = z.object({
  content: reportContentSchema,
  result: resultRowSchema,
  locale: localeSchema.catch("en").default("en"),
});

type PdfBlock = {
  title: string;
  body: string;
  reflectionPrompts: string[];
  practices: string[];
};

type PdfContent = {
  reportTitle: string;
  reportSubtitle: string;
  openingLetter: string;
  blocks: PdfBlock[];
  sevenDayPlan: GeneratedReport["sevenDayPlan"];
  disclaimer: string;
};

const pdfLabels = {
  en: {
    scores: "Protective Role Scores",
    dominant: "Dominant protective role",
    secondary: "Secondary protective role",
    day: "Day",
  },
  fr: {
    scores: "Scores des rôles protecteurs",
    dominant: "Rôle protecteur dominant",
    secondary: "Rôle protecteur secondaire",
    day: "Jour",
  },
  ar: {
    scores: "درجات أدوار الحماية",
    dominant: "دور الحماية الأساسي",
    secondary: "دور الحماية الثانوي",
    day: "اليوم",
  },
} as const;

const pdfFont = (locale: SupportedLocale, bold = false) =>
  locale === "ar" ? (bold ? "Arabic-Bold" : "Arabic") : bold ? "Helvetica-Bold" : "Helvetica";

const localizedTextOptions = (
  locale: SupportedLocale,
  options: PDFKit.Mixins.TextOptions = {},
): PDFKit.Mixins.TextOptions =>
  locale === "ar"
    ? { align: "right", features: ["rtla", "rtlm"], ...options }
    : options;

const legacyToPdfContent = (
  blocks: LegacyReportBlock[],
  result: PdfResult,
  locale: SupportedLocale,
): PdfContent => {
  const dominant = localizedArchetype(locale, result.dominant);
  const secondary = localizedArchetype(locale, result.secondary);
  const [opening, ...rest] = blocks;

  return {
    reportTitle: dominant.name,
    reportSubtitle:
      locale === "ar"
        ? `${dominant.short} دور الحماية الثانوي لديك هو ${secondary.name}.`
        : locale === "fr"
          ? `${dominant.short} Votre rôle protecteur secondaire est ${secondary.name}.`
          : `${dominant.short} Your secondary protective role is ${secondary.name}.`,
    openingLetter: opening?.body ?? "Your answers have been gathered into this SakanBody Audit report.",
    blocks: rest.map((block) => ({
      title: normalizeProtectiveRoleCopy(block.title),
      body: normalizeProtectiveRoleCopy(block.body),
      reflectionPrompts: [],
      practices: (block.bullets ?? []).map(normalizeProtectiveRoleCopy),
    })),
    sevenDayPlan: [],
    disclaimer:
      locale === "ar"
        ? "هذا التقرير أداة للتأمل الذاتي، وليس نصيحة طبية أو تشخيصية أو علاجية."
        : locale === "fr"
          ? "Ce rapport est un outil d’introspection. Il ne constitue pas un avis médical, diagnostique ou thérapeutique."
          : "This report is a self-reflection tool. It is not medical, diagnostic, or therapeutic advice.",
  };
};

const toPdfContent = (content: ReportContent, result: PdfResult, locale: SupportedLocale): PdfContent =>
  generatedReportSchema.safeParse(content).success
    ? (content as GeneratedReport)
    : legacyToPdfContent(z.array(legacyReportBlockSchema).parse(content), result, locale);

const collectPdf = (doc: PDFKit.PDFDocument) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

const writeHeading = (doc: PDFKit.PDFDocument, text: string, locale: SupportedLocale) => {
  doc.moveDown(0.8);
  doc.fillColor("#7c3c60").font(pdfFont(locale, true)).fontSize(20);
  doc.text(normalizeProtectiveRoleCopy(text), localizedTextOptions(locale, { lineGap: 3 }));
  doc.moveDown(0.35);
};

const writeBody = (doc: PDFKit.PDFDocument, text: string, locale: SupportedLocale, options: PDFKit.Mixins.TextOptions = {}) => {
  doc.fillColor("#352317").font(pdfFont(locale)).fontSize(11.5);
  doc.text(normalizeProtectiveRoleCopy(text), localizedTextOptions(locale, { lineGap: 4, ...options }));
};

const ensureSpace = (doc: PDFKit.PDFDocument, height = 120) => {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
};

const writeList = (doc: PDFKit.PDFDocument, items: string[], locale: SupportedLocale) => {
  for (const item of items) {
    ensureSpace(doc, 42);
    doc.fillColor("#6c4b37").font(pdfFont(locale)).fontSize(10.5);
    doc.text(`• ${normalizeProtectiveRoleCopy(item)}`, localizedTextOptions(locale, {
      indent: 10,
      lineGap: 3,
    }));
    doc.moveDown(0.25);
  }
};

const writeScoreRows = (doc: PDFKit.PDFDocument, result: PdfResult, locale: SupportedLocale) => {
  writeHeading(doc, pdfLabels[locale].scores, locale);

  for (const id of archetypeOrder) {
    const meta = archetypes[id];
    const score = roleScoreValue(result.scores[id] ?? result.distribution[id]);
    const x = doc.page.margins.left;
    const y = doc.y + 4;
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const barY = y + 22;

    ensureSpace(doc, 54);
    doc.fillColor("#352317").font(pdfFont(locale, true)).fontSize(10.5);
    if (locale === "ar") {
      doc.text(localizedArchetype(locale, id).name, x + 100, y, localizedTextOptions(locale, { width: width - 100 }));
      doc.font("Helvetica-Bold").text(`${score}/100`, x, y, { align: "left", width: 90 });
    } else {
      doc.text(localizedArchetype(locale, id).name, x, y, { continued: true });
      doc.text(`${score}/100`, { align: "right" });
    }
    doc.roundedRect(x, barY, width, 8, 4).fill("#eadbc5");
    doc.roundedRect(x, barY, (width * score) / 100, 8, 4).fill(meta.color);
    doc.y = barY + 22;
  }
};

const buildPdf = async (content: PdfContent, result: PdfResult, locale: SupportedLocale) => {
  const doc = new PDFDocument({
    autoFirstPage: false,
    margin: 54,
    size: "A4",
  });
  const dominant = localizedArchetype(locale, result.dominant);
  const secondary = localizedArchetype(locale, result.secondary);
  const reportUi = getDictionary(locale).reportUi;
  const pdf = collectPdf(doc);

  if (locale === "ar") {
    const arabicFont = readFileSync(path.join(process.cwd(), "public", "fonts", "NotoSansArabic.ttf"));
    doc.registerFont("Arabic", arabicFont);
    doc.registerFont("Arabic-Bold", arabicFont);
  }

  doc.addPage({ margin: 0 });
  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#7c3c60");
  doc.fillColor("#f8d7ea").font(pdfFont(locale, true)).fontSize(11);
  doc.text(
    locale === "ar" ? "تقرير تقييم سكن بادي" : reportUi.reportEyebrow.toUpperCase(),
    54,
    76,
    localizedTextOptions(locale, { characterSpacing: locale === "ar" ? 0 : 2, width: doc.page.width - 108 }),
  );
  doc.fillColor("#fffaf2").font(pdfFont(locale, true)).fontSize(42);
  doc.text(normalizeProtectiveRoleCopy(content.reportTitle), 54, 142, {
    ...localizedTextOptions(locale),
    lineGap: 8,
    width: doc.page.width - 108,
  });
  doc.fillColor("#f8ead7").font(pdfFont(locale)).fontSize(16);
  doc.text(normalizeProtectiveRoleCopy(content.reportSubtitle), 54, 300, {
    ...localizedTextOptions(locale),
    lineGap: 7,
    width: doc.page.width - 108,
  });
  doc.fillColor("#f8ead7").font(pdfFont(locale)).fontSize(13);
  doc.text(`${pdfLabels[locale].dominant}: ${dominant.name}`, 54, 706, localizedTextOptions(locale, { width: doc.page.width - 108 }));
  doc.text(`${pdfLabels[locale].secondary}: ${secondary.name}`, 54, 728, localizedTextOptions(locale, { width: doc.page.width - 108 }));

  doc.addPage();
  writeHeading(doc, reportUi.openingLetter, locale);
  writeBody(doc, content.openingLetter, locale);
  writeScoreRows(doc, result, locale);

  for (const block of content.blocks) {
    ensureSpace(doc, 180);
    writeHeading(doc, block.title, locale);
    writeBody(doc, block.body, locale);

    if (block.reflectionPrompts.length) {
      writeHeading(doc, reportUi.reflection, locale);
      writeList(doc, block.reflectionPrompts, locale);
    }

    if (block.practices.length) {
      writeHeading(doc, reportUi.practices, locale);
      writeList(doc, block.practices, locale);
    }
  }

  if (content.sevenDayPlan.length) {
    doc.addPage();
    writeHeading(doc, reportUi.sevenDayPlan, locale);

    for (const item of content.sevenDayPlan) {
      ensureSpace(doc, 78);
      doc.fillColor("#7c3c60").font(pdfFont(locale, true)).fontSize(12);
      doc.text(`${pdfLabels[locale].day} ${item.day}: ${normalizeProtectiveRoleCopy(item.title)}`, localizedTextOptions(locale));
      writeBody(doc, item.practice, locale);
      doc.fillColor("#6c4b37").font(locale === "ar" ? pdfFont(locale) : "Helvetica-Oblique").fontSize(10.5);
      doc.text(normalizeProtectiveRoleCopy(item.reflection), localizedTextOptions(locale, { lineGap: 3 }));
      doc.moveDown(0.7);
    }
  }

  ensureSpace(doc, 80);
  doc.moveDown();
  doc.fillColor("#6c4b37").font(pdfFont(locale)).fontSize(9.5);
  doc.text(normalizeProtectiveRoleCopy(content.disclaimer), localizedTextOptions(locale, { lineGap: 3 }));
  doc.end();

  return pdf;
};

const pdfResponse = (pdf: Buffer, id: string) =>
  new Response(new Uint8Array(pdf), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="sakanbody-report-${id}.pdf"`,
      "Content-Type": "application/pdf",
    },
  });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const locale = localeSchema.catch("en").parse(new URL(request.url).searchParams.get("locale") ?? undefined);
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id, result_id, payment_status, content, localized_content, result_locale, content_source, generation_status")
    .eq("id", id)
    .maybeSingle();

  if (reportError || !report) {
    return NextResponse.json(
      { ok: false, error: reportError ? "Could not read report." : "Report not found." },
      { status: reportError ? 500 : 404 },
    );
  }

  if (!unlockedStatuses.has(report.payment_status)) {
    return NextResponse.json(
      { ok: false, error: "Report is locked." },
      { status: 402 },
    );
  }

  if (report.content_source === "ai" && report.generation_status !== "ready") {
    return NextResponse.json(
      { ok: false, error: "AI report is not ready yet." },
      { status: 409 },
    );
  }

  const localizedContent = (report.localized_content && typeof report.localized_content === "object")
    ? report.localized_content as Record<string, unknown>
    : {};
  const content = reportContentSchema.parse(localizedContent[locale] ?? (report.result_locale === locale ? report.content : undefined));
  const { data: resultRow, error: resultError } = await supabase
    .from("archetype_results")
    .select("dominant, secondary, scores, distribution")
    .eq("id", report.result_id ?? report.id)
    .maybeSingle();

  if (resultError || !resultRow) {
    return NextResponse.json(
      { ok: false, error: resultError ? "Could not read result." : "Result not found." },
      { status: resultError ? 500 : 404 },
    );
  }

  const result = resultRowSchema.parse(resultRow);
  const pdf = await buildPdf(toPdfContent(content, result, locale), result, locale);

  return pdfResponse(pdf, id);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = pdfPayloadSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid PDF payload." },
      { status: 400 },
    );
  }

  const { content, result, locale } = parsed.data;
  const pdf = await buildPdf(toPdfContent(content, result, locale), result, locale);

  return pdfResponse(pdf, id);
}
