import type { OperationRow } from "./operations";

const csvCell = (value: unknown) => {
  const raw = String(value ?? "");
  const formulaSafe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${formulaSafe.replaceAll('"', '""')}"`;
};

export const operationsCsvHeaders = [
  "participant_reference",
  "locale",
  "started_at",
  "updated_at",
  "completed",
  "current_screen",
  "dominant_role",
  "secondary_role",
  "payment_status",
  "amount_minor_units",
  "currency",
  "report_status",
] as const;

export function operationsToCsv(rows: OperationRow[]) {
  return [
    operationsCsvHeaders.map(csvCell).join(","),
    ...rows.map((row) =>
      [
        row.participantRef,
        row.locale,
        row.startedAt,
        row.updatedAt,
        row.completed,
        row.currentScreenId,
        row.dominant,
        row.secondary,
        row.paymentStatus,
        row.amount,
        row.currency,
        row.reportStatus,
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\r\n");
}
