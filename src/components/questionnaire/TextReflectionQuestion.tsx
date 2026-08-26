export function TextReflectionQuestion({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const fallback = placeholder ?? "";
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={fallback}
      className="min-h-56 w-full resize-none rounded-[8px] border border-[#C6C7BD] bg-[#FBF9F8]/72 p-5 text-lg leading-8 text-[#28301C] shadow-[0_18px_55px_rgba(40,48,28,0.08)] outline-none transition placeholder:text-[#76786F] focus:border-[#82542A] focus:bg-[#FBF9F8]"
    />
  );
}
