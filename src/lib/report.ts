import { archetypes, type ArchetypeId } from "./archetypes";
import type { Answers, SakanResult } from "./schemas";

export type ReportBlock = {
  title: string;
  body: string;
  bullets?: string[];
};

const selected = (answers: Answers, id: string): string[] => {
  const value = answers[id];
  if (Array.isArray(value)) return value.filter((item) => item !== "Other");
  if (typeof value === "string" && value.trim()) return [value];
  return [];
};

const text = (answers: Answers, id: string, fallback = "") => {
  const value = answers[id];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const join = (items: string[], fallback: string) =>
  items.length ? items.join("; ") : fallback;

const currencyByArchetype: Record<ArchetypeId, string> = {
  anticipator:
    "Your body spends anxiety, scanning, and future-thinking to keep the old sense of safety alive.",
  performer:
    "Your body spends achievement, productivity, and usefulness to keep worth from feeling uncertain.",
  harmonizer:
    "Your body spends belonging, self-editing, and emotional labor to protect connection.",
  quiter:
    "Your body spends withdrawal, sleepiness, slowing down, and stopped desire to preserve energy.",
};

export function buildReportBlocks(
  answers: Answers,
  result: SakanResult,
): ReportBlock[] {
  const dominant = archetypes[result.dominant];
  const secondary = archetypes[result.secondary];
  const childhood = [
    ...selected(answers, "family-role"),
    ...selected(answers, "childhood-truths"),
    ...selected(answers, "childhood-movement"),
  ].slice(0, 12);
  const currentPatterns = [
    ...selected(answers, "hard-to-stop"),
    ...selected(answers, "slowing-fear"),
  ].slice(0, 10);
  const shadow = [
    ...selected(answers, "shadow-clues"),
    ...selected(answers, "fascination-shares"),
    ...selected(answers, "shadow-wants"),
  ].slice(0, 12);
  const sabotage = [
    ...selected(answers, "looping-dream-areas"),
    ...selected(answers, "sabotage-mechanism"),
    ...selected(answers, "dream-shield"),
  ].slice(0, 12);
  const keeps = [
    ...selected(answers, "protection-accomplished"),
    ...selected(answers, "strengths-forged"),
  ].slice(0, 12);
  const jobsDone = selected(answers, "jobs-done");
  const identity = [
    ...selected(answers, "quiet-protection"),
    ...selected(answers, "never-tested"),
    ...selected(answers, "finding-out-fear"),
  ].slice(0, 12);

  return [
    {
      title: "Opening Mirror",
      body: `Your answers suggest ${dominant.name}: ${dominant.short} This does not define you. It names a protection your body learned, likely for intelligent reasons. What stands out is the way your system has tried to keep you safe while another version of you has been quietly asking for more room.`,
    },
    {
      title: "Your Dominant Archetype",
      body: `${dominant.name} protects through ${dominant.coreProtection}. Its body strategy is ${dominant.bodyStrategy}. The emotional logic is simple and tender: ${dominant.promise} What it protected was your younger self's access to safety, dignity, connection, or energy. What it may cost now is presence, choice, and the ease of letting life be less managed by the past.`,
    },
    {
      title: "Your Secondary Archetype",
      body: `${secondary.name} is the second pattern in your result. It blends with ${dominant.name} by adding another layer of protection: ${secondary.bodyStrategy}. Together, these two patterns may explain why part of you reaches forward while another part negotiates safety first.`,
    },
    {
      title: "Your Protection / Shield",
      body: "These are the exact childhood and current patterns you selected. Read them slowly. The report is not trying to improve the language. Your own words are the mirror.",
      bullets: [...childhood, ...currentPatterns],
    },
    {
      title: "Your Currency",
      body: currencyByArchetype[result.dominant],
    },
    {
      title: "The Origin / Why",
      body: `You wrote: "${text(answers, "learned-when", "There may be an early moment your body remembers before your mind can fully name it.")}" You also sensed: "${text(answers, "unspoken-noticed", "something in the environment that shaped what felt safe to need, show, or express.")}"`,
    },
    {
      title: "The Guarantee of the Future",
      body: `${dominant.promise} This is the protection's promise. It is not irrational. It is old. The work is not to shame it, but to update the conditions it is responding to.`,
    },
    {
      title: "The Shadow Personality",
      body: `Your shadow self is not bad. It is the exiled aliveness that became risky to embody. You selected: ${join(shadow, "themes of visibility, wanting, ease, play, or receiving.")} You also wrote: "${text(answers, "most-forbidden", "there is a desire that still feels tender to admit.")}"`,
    },
    {
      title: "Where Dreams Meet Protection",
      body: `The dream you described was: "${text(answers, "specific-dream", "a life that asks more of your aliveness.")}" When you get close, the sabotage pattern includes: ${join(sabotage, "a familiar stop, shrink, delay, or fear response.")} This is the powerful match-up: the way you protected yourself as a child may now be wearing the costume of hesitation around your dream.`,
    },
    {
      title: "What We Keep",
      body: "The protection built real strengths. These do not need to be discarded.",
      bullets: keeps,
    },
    {
      title: "What No Longer Needs To Continue",
      body: `These are jobs your protection may no longer need to do: ${join(jobsDone, "track danger, earn safety, carry what was not yours, or prevent connection from changing.")}`,
    },
    {
      title: "The Promotion",
      body: `The upgraded role you chose includes: ${join(selected(answers, "promotion"), "a softer, present-day version of protection.")} You wrote to your protection: "${text(answers, "thank-protection", "Thank you for keeping me safe. You can now update your role.")}"`,
    },
    {
      title: "Who You Are Outside The Protection",
      body: `When the protection quiets, your selected words include: ${join(identity, "a still-forming self that does not need to be rushed.")} Your glimpse was: "${text(answers, "small-evidence", "small evidence is enough; it does not have to become a full identity yet.")}"`,
    },
    {
      title: "Personalized Practices",
      body: "Choose one practice at a time. These are invitations for self-reflection, not medical instructions.",
      bullets: dominant.practices,
    },
    {
      title: "Closing Message",
      body: `You do not need to destroy the protection. You are learning to update it. Your closing words were: "${text(answers, "closing-recognition", "I see you. Take your time.")}"`,
    },
  ];
}
