import { NextResponse } from "next/server";
import { chromium } from "playwright";
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
import { getSupabaseAdmin } from "@/lib/supabase/server";

const unlockedStatuses = new Set(["paid", "demo_unlocked"]);

const resultRowSchema = z.object({
  dominant: z.enum(["anticipator", "performer", "harmonizer", "quiter"]),
  secondary: z.enum(["anticipator", "performer", "harmonizer", "quiter"]),
  distribution: z.record(z.string(), z.number()),
});

type PdfResult = z.infer<typeof resultRowSchema>;

const pdfPayloadSchema = z.object({
  content: reportContentSchema,
  result: resultRowSchema,
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

const escapeHtml = (value: string | number) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const listItems = (items: string[]) =>
  items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

const legacyToPdfContent = (
  blocks: LegacyReportBlock[],
  result: PdfResult,
): PdfContent => {
  const dominant = archetypes[result.dominant];
  const secondary = archetypes[result.secondary];
  const [opening, ...rest] = blocks;

  return {
    reportTitle: dominant.name,
    reportSubtitle: `${dominant.short} Your secondary pattern is ${secondary.name}, creating a nuanced blend of protection and becoming.`,
    openingLetter: opening?.body ?? "Your answers have been gathered into this SakanBody Audit report.",
    blocks: rest.map((block) => ({
      title: block.title,
      body: block.body,
      reflectionPrompts: [],
      practices: block.bullets ?? [],
    })),
    sevenDayPlan: [],
    disclaimer:
      "This report is a self-reflection tool. It is not medical, diagnostic, or therapeutic advice.",
  };
};

const toPdfContent = (content: ReportContent, result: PdfResult): PdfContent =>
  generatedReportSchema.safeParse(content).success
    ? (content as GeneratedReport)
    : legacyToPdfContent(z.array(legacyReportBlockSchema).parse(content), result);

const buildPdfHtml = (content: PdfContent, result: PdfResult) => {
  const dominant = archetypes[result.dominant];
  const secondary = archetypes[result.secondary];
  const scoreRows = archetypeOrder
    .map((id) => {
      const score = result.distribution[id] ?? 0;
      const meta = archetypes[id];

      return `
        <div class="score-row">
          <div class="score-label">
            <span>${escapeHtml(meta.name)}</span>
            <strong>${escapeHtml(score)}%</strong>
          </div>
          <div class="score-track"><div class="score-fill" style="width: ${score}%; background: ${meta.color};"></div></div>
        </div>
      `;
    })
    .join("");

  const sections = content.blocks
    .map(
      (block) => `
        <section class="section">
          <h2>${escapeHtml(block.title)}</h2>
          <p>${escapeHtml(block.body)}</p>
          ${
            block.reflectionPrompts.length || block.practices.length
              ? `<div class="two-col">
                  ${
                    block.reflectionPrompts.length
                      ? `<div>
                          <h3>Reflection prompts</h3>
                          <ul>${listItems(block.reflectionPrompts)}</ul>
                        </div>`
                      : ""
                  }
                  ${
                    block.practices.length
                      ? `<div>
                          <h3>Practices</h3>
                          <ul>${listItems(block.practices)}</ul>
                        </div>`
                      : ""
                  }
                </div>`
              : ""
          }
        </section>
      `,
    )
    .join("");

  const plan = content.sevenDayPlan
    .map(
      (item) => `
        <div class="plan-item">
          <strong>Day ${escapeHtml(item.day)}: ${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.practice)}</p>
          <em>${escapeHtml(item.reflection)}</em>
        </div>
      `,
    )
    .join("");

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body {
            margin: 0;
            background: #fbf7ef;
            color: #352317;
            font-family: Georgia, "Times New Roman", serif;
            line-height: 1.55;
          }
          .cover {
            min-height: 920px;
            padding: 78px 64px;
            background: linear-gradient(140deg, #7c3c60, #a95888 58%, #352317);
            color: #fffaf2;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .eyebrow {
            color: #f8d7ea;
            font-family: Arial, sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.24em;
            text-transform: uppercase;
          }
          h1 {
            margin: 28px 0 18px;
            font-size: 54px;
            line-height: 1;
          }
          .subtitle {
            max-width: 680px;
            color: #f8ead7;
            font-size: 21px;
          }
          .blend {
            border-top: 1px solid rgba(255, 250, 242, 0.28);
            padding-top: 28px;
            color: #f8ead7;
            font-size: 18px;
          }
          .page {
            padding: 46px 54px;
            break-after: page;
          }
          .letter {
            border: 1px solid #e4cda9;
            background: #fffaf2;
            padding: 30px;
            border-radius: 8px;
            font-size: 18px;
          }
          .scores {
            margin-top: 28px;
            border: 1px solid #e4cda9;
            background: #fffaf2;
            padding: 24px;
            border-radius: 8px;
          }
          .score-row { margin: 14px 0; }
          .score-label {
            display: flex;
            justify-content: space-between;
            font-family: Arial, sans-serif;
            font-size: 13px;
          }
          .score-track {
            height: 10px;
            margin-top: 7px;
            overflow: hidden;
            border-radius: 999px;
            background: #eadbc5;
          }
          .score-fill { height: 100%; border-radius: 999px; }
          .section {
            padding: 42px 54px;
            break-inside: avoid;
            border-bottom: 1px solid #e4cda9;
          }
          h2 {
            margin: 0 0 16px;
            color: #7c3c60;
            font-size: 28px;
            line-height: 1.15;
          }
          h3 {
            margin: 0 0 10px;
            color: #6c4b37;
            font-family: Arial, sans-serif;
            font-size: 12px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }
          p { margin: 0; font-size: 16px; }
          ul { margin: 0; padding-left: 18px; }
          li { margin: 0 0 8px; }
          .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-top: 24px;
          }
          .plan {
            padding: 42px 54px 54px;
          }
          .plan-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-top: 22px;
          }
          .plan-item {
            border: 1px solid #e4cda9;
            background: #fffaf2;
            border-radius: 8px;
            padding: 16px;
            break-inside: avoid;
          }
          .plan-item strong {
            display: block;
            color: #7c3c60;
            font-family: Arial, sans-serif;
            font-size: 13px;
          }
          .plan-item p { margin: 10px 0; font-size: 14px; }
          .plan-item em { color: #6c4b37; font-size: 13px; }
          .disclaimer {
            margin-top: 28px;
            color: #6c4b37;
            font-family: Arial, sans-serif;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="cover">
          <div>
            <div class="eyebrow">SakanBody Audit Report</div>
            <h1>${escapeHtml(content.reportTitle)}</h1>
            <p class="subtitle">${escapeHtml(content.reportSubtitle)}</p>
          </div>
          <div class="blend">
            Dominant pattern: ${escapeHtml(dominant.name)}<br />
            Secondary pattern: ${escapeHtml(secondary.name)}
          </div>
        </div>
        <main>
          <div class="page">
            <div class="letter">${escapeHtml(content.openingLetter)}</div>
            <div class="scores">${scoreRows}</div>
          </div>
          ${sections}
          ${
            content.sevenDayPlan.length
              ? `<section class="plan">
                  <h2>Seven-Day Integration Plan</h2>
                  <div class="plan-grid">${plan}</div>
                  <p class="disclaimer">${escapeHtml(content.disclaimer)}</p>
                </section>`
              : `<section class="plan">
                  <p class="disclaimer">${escapeHtml(content.disclaimer)}</p>
                </section>`
          }
        </main>
      </body>
    </html>`;
};

export async function GET(
  _request: Request,
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
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id, result_id, payment_status, content, content_source, generation_status")
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

  if (
    report.content_source === "ai" &&
    report.generation_status !== "ready"
  ) {
    return NextResponse.json(
      { ok: false, error: "AI report is not ready yet." },
      { status: 409 },
    );
  }

  const content = reportContentSchema.parse(report.content);
  const { data: resultRow, error: resultError } = await supabase
    .from("archetype_results")
    .select("dominant, secondary, distribution")
    .eq("id", report.result_id ?? report.id)
    .maybeSingle();

  if (resultError || !resultRow) {
    return NextResponse.json(
      { ok: false, error: resultError ? "Could not read result." : "Result not found." },
      { status: resultError ? 500 : 404 },
    );
  }

  const result = resultRowSchema.parse(resultRow);
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    await page.setContent(buildPdfHtml(toPdfContent(content, result), result), {
      waitUntil: "networkidle",
    });
    await page.emulateMedia({ media: "screen" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="sakanbody-report-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } finally {
    await browser.close();
  }
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

  const { content, result } = parsed.data;
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    await page.setContent(buildPdfHtml(toPdfContent(content, result), result), {
      waitUntil: "networkidle",
    });
    await page.emulateMedia({ media: "screen" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="sakanbody-report-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } finally {
    await browser.close();
  }
}
