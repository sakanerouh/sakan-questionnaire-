import { Check } from "lucide-react";
import type { Option } from "@/lib/questionnaire";

export function MultiSelectQuestion({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const toggle = (label: string) => {
    onChange(value.includes(label) ? value.filter((item) => item !== label) : [...value, label]);
  };

  return (
    <div className="grid gap-3">
      {options.map((option, index) => {
        const selected = value.includes(option.label);

        return (
          <button
            key={option.label}
            type="button"
            aria-keyshortcuts={index < 9 ? String(index + 1) : index === 9 ? "0" : undefined}
            onClick={() => toggle(option.label)}
            className={`flex items-start gap-3 rounded-[8px] border p-4 text-left text-base leading-7 transition ${
              selected
                ? "sakan-gradient border-[#A95888] text-[#fffaf2] shadow-[0_18px_45px_rgba(124,60,96,0.2)]"
                : "border-[#ead5e2] bg-white/58 text-[#5d402d] hover:border-[#DDA8C8] hover:bg-white/80"
            }`}
          >
            <span
              className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded border ${
                selected ? "border-[#fffaf2] bg-[#fffaf2] text-[#7C3C60]" : "border-[#DDA8C8]"
              }`}
            >
              {selected && <Check className="h-3.5 w-3.5" aria-hidden />}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
