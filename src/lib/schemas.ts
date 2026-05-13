import { z } from "zod";

export const answerValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.object({
    value: z.string().optional(),
    other: z.string().optional(),
  }),
]);

export const answersSchema = z.record(z.string(), answerValueSchema);

export const resultSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  dominant: z.enum(["anticipator", "performer", "harmonizer", "quiter"]),
  secondary: z.enum(["anticipator", "performer", "harmonizer", "quiter"]),
  scores: z.record(z.enum(["anticipator", "performer", "harmonizer", "quiter"]), z.number()),
  distribution: z.record(z.enum(["anticipator", "performer", "harmonizer", "quiter"]), z.number()),
  keyPatterns: z.array(z.string()),
  shadowThemes: z.array(z.string()),
  dreamSabotageThemes: z.array(z.string()),
  protectionThemes: z.array(z.string()),
  completedAt: z.string(),
});

export const sessionPayloadSchema = z.object({
  sessionId: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  answers: answersSchema,
  result: resultSchema.optional(),
  completed: z.boolean().optional(),
});

export type Answers = z.infer<typeof answersSchema>;
export type SakanResult = z.infer<typeof resultSchema>;
