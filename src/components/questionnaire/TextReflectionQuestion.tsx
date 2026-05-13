export function TextReflectionQuestion({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder ?? "Write what feels true. Fragments are welcome."}
      className="min-h-56 w-full resize-none rounded-[8px] border border-[#ead5e2] bg-white/62 p-5 text-lg leading-8 text-[#352317] shadow-[0_18px_55px_rgba(124,60,96,0.08)] outline-none transition placeholder:text-[#9b7a61] focus:border-[#A95888] focus:bg-white/82"
    />
  );
}
