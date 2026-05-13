import { Sparkles } from "lucide-react";

export function PracticeCard({ practice }: { practice: string }) {
  return (
    <div className="rounded-[8px] border border-[#e4cda9] bg-white/58 p-5">
      <Sparkles className="h-5 w-5 text-[#A95888]" aria-hidden />
      <p className="mt-4 text-base leading-7 text-[#5d402d]">{practice}</p>
    </div>
  );
}
