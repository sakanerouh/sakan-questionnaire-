"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { preservePathAndSearch } from "@/i18n/path";

const choices: AppLocale[] = ["en", "fr"];

function LanguageSwitcherInner({ className = "" }: { className?: string }) {
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
      className={`inline-flex items-center rounded-full border border-[#DDA8C8]/70 bg-[#fffaf2]/80 p-1 text-xs font-semibold shadow-sm backdrop-blur ${className}`}
    >
      {choices.map((choice, index) => (
        <span key={choice} className="contents">
          {index > 0 && <span aria-hidden className="px-0.5 text-[#b98aa5]">|</span>}
          <button
            type="button"
            lang={choice}
            aria-pressed={choice === locale}
            aria-label={t("switchLanguage", { language: choice.toUpperCase() })}
            onClick={() => selectLocale(choice)}
            className={`min-h-9 min-w-10 rounded-full px-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A95888] ${
              choice === locale
                ? "bg-[#7C3C60] text-[#fffaf2]"
                : "text-[#7C3C60] hover:bg-[#f5e4ee]"
            }`}
          >
            {choice.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  return (
    <Suspense fallback={<div className={`h-11 w-[106px] ${className}`} aria-hidden />}>
      <LanguageSwitcherInner className={className} />
    </Suspense>
  );
}
