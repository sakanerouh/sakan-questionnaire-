export function ProgressBar({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const percent = Math.round((current / Math.max(total, 1)) * 100);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#82542A]">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#E4E2E2]">
        <div
          className="h-full rounded-full bg-[#3E4631] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
