import { LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";

export function LockedPreviewCard({ title }: { title: string }) {
  const t = useTranslations("resultUi");
  return (
    <div className="relative min-h-32 overflow-hidden rounded-[8px] border border-[#C6C7BD] bg-[#FBF9F8]/72 p-5">
      <div className="absolute inset-0 bg-[#FBF9F8]/45 backdrop-blur-[2px]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#82542A]">
            {t("locked")}
          </p>
          <h3 className="mt-3 text-xl font-semibold text-[#28301C]">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-[#464840] blur-[2px]">
            {t("lockedBody")}
          </p>
        </div>
        <LockKeyhole className="h-5 w-5 shrink-0 text-[#82542A]" aria-hidden />
      </div>
    </div>
  );
}
