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
      <div className="mb-3 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3C60]">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#f1d6e6]">
        <div
          className="sakan-gradient h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
