import {
  Activity,
  Award,
  HeartHandshake,
  Moon,
  type LucideIcon,
} from "lucide-react";

export type ArchetypeId = "anticipator" | "performer" | "harmonizer" | "quiter";

export type ArchetypeMeta = {
  id: ArchetypeId;
  name: string;
  short: string;
  coreProtection: string;
  bodyStrategy: string;
  promise: string;
  currency: string;
  color: string;
  icon: LucideIcon;
  practices: string[];
};

export const archetypes: Record<ArchetypeId, ArchetypeMeta> = {
  anticipator: {
    id: "anticipator",
    name: "The Anticipator",
    short: "Body always preparing for pressure or chaos.",
    coreProtection: "preparing before life can surprise you",
    bodyStrategy: "scanning ahead, reading the room, running scenarios, and staying ready",
    promise: "If I anticipate, I stay safe.",
    currency: "anxiety, vigilance, and the energy spent preparing for what may never happen",
    color: "#A95888",
    icon: Activity,
    practices: [
      "60-second orienting practice: name five neutral things in the room before solving anything.",
      "Journal: What is actually happening now, and what am I preparing for?",
      "Body scan for present safety: jaw, shoulders, ribs, belly, feet.",
      "Choose one small plan to pause before adding another contingency.",
    ],
  },
  performer: {
    id: "performer",
    name: "The Performer",
    short: "Body believes safety comes from achievement.",
    coreProtection: "earning safety through achievement, usefulness, and proof",
    bodyStrategy: "producing, improving, optimizing, and staying impressive",
    promise: "If I achieve, I stay worthy.",
    currency: "achievement, urgency, self-improvement, and rest that has to be earned",
    color: "#DDA8C8",
    icon: Award,
    practices: [
      "Rest without earning practice: take ten minutes before completing the next useful thing.",
      "Unfinished task tolerance: leave one low-stakes task incomplete for an evening.",
      "Pleasure before productivity: let the body receive something beautiful first.",
      "Journal: Who am I when nothing is being proven?",
    ],
  },
  harmonizer: {
    id: "harmonizer",
    name: "The Harmonizer",
    short: "Body prioritizes belonging over self-expression.",
    coreProtection: "preserving connection by tracking others and softening yourself",
    bodyStrategy: "peacemaking, caretaking, staying small, and sensing what others need",
    promise: "If I harmonize, I stay loved.",
    currency: "belonging, self-silencing, emotional labor, and the cost of not disappointing anyone",
    color: "#7C3C60",
    icon: HeartHandshake,
    practices: [
      "One honest no: choose a low-stakes place to let a clean no exist.",
      "Belonging without performance reflection: what connection remains when I stop managing it?",
      "Hand-on-heart self-expression: say one true sentence out loud before editing it.",
      "Track the difference between generosity and fear-driven caretaking.",
    ],
  },
  quiter: {
    id: "quiter",
    name: "The Quiter",
    short: "Body protects energy through withdrawal or slowing down.",
    coreProtection: "saving your energy by stopping before life asks too much",
    bodyStrategy: "withdrawing, sleeping, losing interest, slowing down, and avoiding pressure",
    promise: "If I withdraw, I preserve myself.",
    currency: "withdrawal, depletion, postponed desire, and the quiet grief of stopping at the threshold",
    color: "#8d7a6d",
    icon: Moon,
    practices: [
      "Tiny next step practice: choose one action that takes less than three minutes.",
      "Energy permission ritual: place a hand on the body and name what is genuinely available today.",
      "Gentle movement before avoidance: one song, one walk, one stretch, no performance.",
      "Journal: What pressure is my body trying to escape?",
    ],
  },
};

export const archetypeOrder: ArchetypeId[] = [
  "anticipator",
  "performer",
  "harmonizer",
  "quiter",
];

export const emptyScores = (): Record<ArchetypeId, number> => ({
  anticipator: 0,
  performer: 0,
  harmonizer: 0,
  quiter: 0,
});
