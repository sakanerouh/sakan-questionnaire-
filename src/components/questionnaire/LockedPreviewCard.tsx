import { LockKeyhole } from "lucide-react";

export function LockedPreviewCard({ title }: { title: string }) {
  return (
    <div className="relative min-h-32 overflow-hidden rounded-[8px] border border-[#e4cda9] bg-white/58 p-5">
      <div className="absolute inset-0 bg-[#fffaf2]/45 backdrop-blur-[2px]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3C60]">
            Locked
          </p>
          <h3 className="mt-3 text-xl font-semibold text-[#352317]">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-[#6c4b37] blur-[2px]">
            A personalized mirror from your exact answers will appear here.
          </p>
        </div>
        <LockKeyhole className="h-5 w-5 shrink-0 text-[#A95888]" aria-hidden />
      </div>
    </div>
  );
}
