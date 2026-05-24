import { z } from "zod";

export const legacyReportBlockSchema = z.object({
  title: z.string(),
  body: z.string(),
  bullets: z.array(z.string()).optional(),
});

export const generatedReportBlockSchema = z.object({
  title: z.string(),
  body: z.string(),
  reflectionPrompts: z.array(z.string()),
  practices: z.array(z.string()),
});

export const sevenDayPlanItemSchema = z.object({
  day: z.number(),
  title: z.string(),
  practice: z.string(),
  reflection: z.string(),
});

export const generatedReportSchema = z.object({
  version: z.string(),
  reportTitle: z.string(),
  reportSubtitle: z.string(),
  openingLetter: z.string(),
  blocks: z.array(generatedReportBlockSchema),
  sevenDayPlan: z.array(sevenDayPlanItemSchema),
  disclaimer: z.string(),
});

export const reportContentSchema = z.union([
  generatedReportSchema,
  z.array(legacyReportBlockSchema),
]);

export type LegacyReportBlock = z.infer<typeof legacyReportBlockSchema>;
export type GeneratedReport = z.infer<typeof generatedReportSchema>;
export type GeneratedReportBlock = z.infer<typeof generatedReportBlockSchema>;
export type SevenDayPlanItem = z.infer<typeof sevenDayPlanItemSchema>;
export type ReportContent = z.infer<typeof reportContentSchema>;

export const isGeneratedReport = (
  content: ReportContent | unknown,
): content is GeneratedReport => generatedReportSchema.safeParse(content).success;
