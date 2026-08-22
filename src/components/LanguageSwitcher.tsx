"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { preservePathAndSearch } from "@/i18n/path";

const choices: AppLocale[] = ["en", "fr"];

function LanguageSwitcherInner({
  className = "",
  theme = "rose",
}: {
  className?: string;
  theme?: "rose" | "olive";
}) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("common");

  const selectLocale = (nextLocale: AppLocale) => {
    if (nextLocale === locale) return;
    router.replace(preservePathAndSearch(pathname, searchParams.toString()), { locale: nextLocale });
  };

  return (
    <div
      role="group"
      aria-label={t("languageSelector")}
      className={`inline-flex items-center rounded-full border p-1 text-xs font-semibold backdrop-blur ${
        theme === "olive"
          ? "border-[#c6c7bd] bg-[#fbf9f8]/80"
          : "border-[#DDA8C8]/70 bg-[#fffaf2]/80 shadow-sm"
      } ${className}`}
    >
      {choices.map((choice, index) => (
        <span key={choice} className="contents">
          {index > 0 && (
            <span aria-hidden className={`px-0.5 ${theme === "olive" ? "text-[#82542a]/55" : "text-[#b98aa5]"}`}>
              |
            </span>
          )}
          <button
            type="button"
            lang={choice}
            aria-pressed={choice === locale}
            aria-label={t("switchLanguage", { language: choice.toUpperCase() })}
            onClick={() => selectLocale(choice)}
            className={`min-h-9 min-w-10 rounded-full px-2 transition focus:outline-none focus-visible:ring-2 ${
              theme === "olive" ? "focus-visible:ring-[#82542a]" : "focus-visible:ring-[#A95888]"
            } ${
              choice === locale
                ? theme === "olive" ? "bg-[#3e4631] text-[#fbf9f2]" : "bg-[#7C3C60] text-[#fffaf2]"
                : theme === "olive" ? "text-[#3e4631] hover:bg-[#eae8e7]" : "text-[#7C3C60] hover:bg-[#f5e4ee]"
            }`}
          >
            {choice.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}

export function LanguageSwitcher({
  className = "",
  theme = "rose",
}: {
  className?: string;
  theme?: "rose" | "olive";
}) {
  return (
    <Suspense fallback={<div className={`h-11 w-[106px] ${className}`} aria-hidden />}>
      <LanguageSwitcherInner className={className} theme={theme} />
    </Suspense>
  );
}
