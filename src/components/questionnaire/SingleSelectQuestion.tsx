import type { Option } from "@/lib/questionnaire";

export function SingleSelectQuestion({
  options,
  value,
  onChange,
  getLabel,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  getLabel: (id: string) => string;
}) {
  return (
    <div className="grid gap-3">
      {options.map((option, index) => {
        const selected = value === option.id;

        return (
          <button
            key={option.id}
            type="button"
            aria-keyshortcuts={index < 9 ? String(index + 1) : index === 9 ? "0" : undefined}
            onClick={() => onChange(option.id)}
            className={`rounded-[8px] border p-4 text-left text-base leading-7 transition ${
              selected
                ? "sakan-gradient border-[#A95888] text-[#fffaf2] shadow-[0_18px_45px_rgba(124,60,96,0.2)]"
                : "border-[#ead5e2] bg-white/58 text-[#5d402d] hover:border-[#DDA8C8] hover:bg-white/80"
            }`}
          >
            {getLabel(option.id)}
          </button>
        );
      })}
    </div>
  );
}
