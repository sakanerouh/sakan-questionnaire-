"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { initializeAuditClient } from "@/lib/audit/client";
import type { AppLocale } from "@/i18n/routing";
import { nextStepsWhatsAppUrl } from "@/content/nextSteps";

export function AuditGate({ children }: { children: React.ReactNode }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("auditCheckout");
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => { setError(""); setAttempt((value) => value + 1); }, []);
  useEffect(() => {
    let cancelled = false;
    initializeAuditClient(locale).then((state) => {
      if (cancelled) return;
      if (state.granted) setReady(true);
      else router.replace("/questionnaire/checkout");
    }).catch(() => { if (!cancelled) setError(t("accessError")); });
    return () => { cancelled = true; };
  }, [locale, router, t, attempt]);
  if (ready) return children;
  return <main className="grid min-h-screen place-items-center bg-[#f5f2e9] px-6 text-[#1f3f34]">
    <div className="max-w-lg text-center" aria-live="polite"><p>{error || t("checking")}</p>
      {error && <><button type="button" onClick={retry} className="mt-5 rounded-full bg-[#1f3f34] px-6 py-3 text-white">{t("retry")}</button>
        <a className="ms-4 underline" href={nextStepsWhatsAppUrl(locale === "ar" ? "مرحبًا، أحتاج إلى المساعدة لاستعادة الوصول إلى تدقيقي." : "Hello, I need help restoring access to my audit.")} target="_blank" rel="noopener noreferrer">{t("contact")}</a></>}
    </div>
  </main>;
}
