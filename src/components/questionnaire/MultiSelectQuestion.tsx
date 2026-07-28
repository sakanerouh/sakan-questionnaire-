import { Check } from "lucide-react";
import type { Option } from "@/lib/questionnaire";

export function MultiSelectQuestion({
  options,
  value,
  onChange,
  getLabel,
}: {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  getLabel: (id: string) => string;
}) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  };

  return (
    <div className="grid gap-3">
      {options.map((option, index) => {
        const selected = value.includes(option.id);

        return (
          <button
            key={option.id}
            type="button"
            aria-keyshortcuts={index < 9 ? String(index + 1) : index === 9 ? "0" : undefined}
            onClick={() => toggle(option.id)}
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
            {getLabel(option.id)}
          </button>
        );
      })}
    </div>
  );
}
