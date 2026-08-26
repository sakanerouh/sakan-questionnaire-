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
                ? "border-[#3E4631] bg-[#3E4631] text-[#FBF9F8] shadow-[0_18px_45px_rgba(40,48,28,0.18)]"
                : "border-[#C6C7BD] bg-[#FBF9F8]/72 text-[#464840] hover:border-[#ABB499] hover:bg-[#F5F3F3]"
            }`}
          >
            {getLabel(option.id)}
          </button>
        );
      })}
    </div>
  );
}
