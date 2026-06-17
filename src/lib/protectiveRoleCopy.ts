const replacements: Array<[RegExp, string]> = [
  [/\bThe Anticipator\b/g, "The Watcher"],
  [/\bAnticipator\b/g, "Watcher"],
  [/\bThe Performer\b/g, "The Striver"],
  [/\bPerformer\b/g, "Striver"],
  [/\bThe Quiter\b/g, "The Shield"],
  [/\bQuiter\b/g, "Shield"],
  [/\bdominant archetype\b/gi, "dominant protective role"],
  [/\bsecondary archetype\b/gi, "secondary protective role"],
  [/\barchetype blend\b/gi, "protective role blend"],
  [/\barchetype result\b/gi, "protective role result"],
  [/\barchetype\b/gi, "protective role"],
  [/\barchetypes\b/gi, "protective roles"],
];

export const normalizeProtectiveRoleCopy = (value: string) =>
  replacements.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value,
  );

export const roleScoreValue = (value: number | undefined) =>
  Math.max(0, Math.min(100, Math.round(value ?? 0)));
