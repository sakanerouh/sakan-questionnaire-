"use client";

import { useEffect, useState } from "react";
import localFont from "next/font/local";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useQuestionnaireStore } from "@/lib/questionnaireStore";
import { applyAuditState, auditRequest, initializeAuditClient } from "@/lib/audit/client";
import { formatAuditPrice, type AuditAccessState, type AuditPrice } from "@/lib/audit/types";
import { nextStepsWhatsAppUrl } from "@/content/nextSteps";
import styles from "./AuditCheckout.module.css";

const serif = localFont({ src: "../../assets/fonts/lora/Lora-Latin-Variable.woff2", variable: "--font-landing-serif", display: "swap" });
const resumeRequests = new Map<string, Promise<AuditAccessState>>();

function CheckoutFrame({ children }: { children: React.ReactNode }) {
  const t = useTranslations("auditCheckout");
  const locale = useLocale();
  return <main className={`${styles.page} ${serif.variable}`}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label={t("home")}>
        <svg viewBox="0 0 54 42" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M2 20C6-2 48-2 52 20M10 20C13 5 40 5 44 20M27 6V40" /></svg>
        <span>{locale === "ar" ? "سكن الروح" : "SAKAN EROUH"}</span>
      </Link>
      <LanguageSwitcher theme="olive" className={styles.languages} />
    </header>
    <div className={styles.content}>
      <ol className={styles.steps} aria-label={t("steps")}>
        <li><span className={styles.circle}><Check size={19} aria-hidden="true" /></span><span>{t("introStep")}</span></li>
        <li className={styles.active} aria-current="step"><span className={styles.circle}>{locale === "ar" ? "٢" : "2"}</span><span>{t("checkoutStep")}</span></li>
        <li><span className={styles.circle}>{locale === "ar" ? "٣" : "3"}</span><span>{t("questionnaireStep")}</span></li>
      </ol>
      {children}
    </div>
  </main>;
}

export function AuditCheckout({ step, price, checkoutId, cancelled = false, demo = false }: {
  step: "intro" | "payment" | "resume"; price: AuditPrice; checkoutId?: string; cancelled?: boolean; demo?: boolean;
}) {
  const t = useTranslations("auditCheckout");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const email = useQuestionnaireStore((s) => s.email);
  const setEmail = useQuestionnaireStore((s) => s.setEmail);
  const [state, setState] = useState<AuditAccessState | null>(null);
  const [busy, setBusy] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [whatsapp, setWhatsapp] = useState("");
  const displayPrice = formatAuditPrice(price, locale);
  const demoCheckout = demo && !price;

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function check() {
      try {
        let access: AuditAccessState;
        if (step === "resume") {
          const token = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
          if (!resumeRequests.has(token)) resumeRequests.set(token, auditRequest<AuditAccessState>("/api/questionnaire/resume", { token }));
          access = await resumeRequests.get(token)!;
          applyAuditState(access);
          if (!stopped) {
            window.history.replaceState(null, "", window.location.pathname);
            router.replace(access.result ? "/questionnaire/result" : "/questionnaire/start");
          }
          return;
        }
        access = await initializeAuditClient(locale);
        if (checkoutId) access = await auditRequest<AuditAccessState>("/api/checkout/verify", { sessionId: access.sessionId, checkoutId });
        if (stopped) return;
        setState(access); setBusy(false); setError("");
        if (access.granted && (step === "intro" || checkoutId || access.flow === "post_audit")) {
          router.replace(access.result ? "/questionnaire/result" : "/questionnaire/start");
          return;
        }
        if (!access.granted && (access.transferPending || checkoutId)) timer = setTimeout(check, 5000);
      } catch {
        if (!stopped) { setError(t(step === "resume" ? "linkError" : "accessError")); setBusy(false); }
      }
    }
    void check();
    return () => { stopped = true; clearTimeout(timer); };
  }, [locale, router, step, checkoutId, t, attempt]);

  async function pay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state) return;
    const method = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value ?? "card";
    const popup = method === "transfer" ? window.open("about:blank", "_blank") : null;
    if (popup) popup.opener = null;
    setSubmitting(true); setError("");
    try {
      const data = await auditRequest<{ url?: string; granted?: boolean }>(method === "transfer" ? "/api/checkout/transfer" : "/api/checkout", {
        sessionId: state.sessionId, email, locale,
      });
      if (data.granted) { popup?.close(); setAttempt((value) => value + 1); return; }
      if (!data.url) throw new Error("Missing checkout URL");
      if (method === "transfer") {
        setWhatsapp(data.url);
        if (popup) popup.location.href = data.url;
        setState({ ...state, transferPending: true });
        setAttempt((value) => value + 1);
      } else { window.location.assign(data.url); }
    } catch { popup?.close(); setError(t("paymentError")); }
    finally { setSubmitting(false); }
  }

  const status = <>
    {error && <div className={`${styles.status} ${styles.error}`} role="alert"><p>{error}</p>
      <button type="button" className={styles.textButton} onClick={() => { if (step === "resume") resumeRequests.clear(); setBusy(true); setAttempt((value) => value + 1); }}>{t("retry")}</button>
      <a className={styles.textButton} style={{ marginInlineStart: 20 }} href={nextStepsWhatsAppUrl(locale === "ar" ? "مرحبًا، أحتاج إلى المساعدة للوصول إلى تدقيقي." : "Hello, I need help accessing my audit.")} target="_blank" rel="noopener noreferrer">{t("contact")}</a>
    </div>}
    {busy && <p className={styles.note} role="status">{t("checking")}</p>}
  </>;

  if (step === "resume") return <CheckoutFrame><h1 className={`${styles.title} ${styles.paymentTitle}`}>{t("restoring")}</h1>{status}</CheckoutFrame>;

  if (step === "intro") return <CheckoutFrame>
    <section className={styles.intro}>
      <p className={styles.eyebrow}>{t("product")}</p>
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.description}>{t("description")}</p>
      <p className={styles.duration}>{t("duration")}</p>
      <div className={styles.benefits}><h2>{t("benefitsTitle")}</h2><ul>{(t.raw("benefits") as string[]).map((text) => <li key={text}>{text}</li>)}</ul></div>
      <p className={styles.price}>{displayPrice ? `${displayPrice} · ${t("oneTime")}` : t(demoCheckout ? "demo" : "priceUnavailable")}</p>
      <Link href="/questionnaire/payment" className={styles.primary}>{t("continue")}<ArrowRight size={23} aria-hidden="true" /></Link>
      <p className={styles.note}>{t("afterPayment")}<br />{t("finishForReport")}</p>
      {status}
    </section>
  </CheckoutFrame>;

  return <CheckoutFrame>
    <h1 className={`${styles.title} ${styles.paymentTitle}`}>{t("choose")}</h1>
    <div className={styles.summary}><span dir="ltr">SakanBody Audit</span><span>{displayPrice ?? t(demoCheckout ? "demo" : "priceUnavailable")}</span></div>
    {status}
    {!busy && state?.granted ? <div className={styles.status} role="status"><p>{t("confirmed")}</p><Link href="/questionnaire/start" className={styles.primary}>{t("start")}<ArrowRight size={20} aria-hidden="true" /></Link></div> : <>
      {cancelled && <p className={styles.note}>{t("cancelled")}</p>}
      {checkoutId && !error && !busy && <p className={styles.status} role="status">{t("pendingCard")}</p>}
      <form onSubmit={pay}>
        <label className={styles.email}>{t("emailLabel")}<input name="email" type="email" required autoComplete="email" dir="ltr" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /><small>{t("emailHelp")}</small></label>
        <section className={styles.method}><h2>{t("cardTitle")}</h2><p>{t("cardBody")}</p>
          <button type="submit" name="method" value="card" className={styles.primary} disabled={busy || submitting || !state || (!price && !demoCheckout)}>{submitting ? t("opening") : t(demoCheckout ? "demo" : "cardCta")}</button>
          {!price && !demoCheckout && <p className={styles.note}>{t("cardUnavailable")}</p>}
        </section>
        <section className={styles.method}><h2>{t("bankTitle")}</h2><strong>{t("moroccoOnly")}</strong><p>{t("bankBody")}<br />{t("bankConfirm")}</p><p>{t("bankAmount")}</p>
          <p dir="ltr">+212 764 131 039</p>
          <button type="submit" name="method" value="transfer" className={styles.secondary} disabled={busy || submitting || !state}>{submitting ? t("opening") : t("whatsappCta")}</button>
        </section>
      </form>
      {(state?.transferPending || whatsapp) && <div className={styles.status} role="status"><p>{t("pendingTransfer")}</p>{whatsapp && <a className={styles.textButton} href={whatsapp} target="_blank" rel="noopener noreferrer">{t("whatsappCta")}</a>}
        <button type="button" className={styles.textButton} style={{ marginInlineStart: 20 }} onClick={() => setAttempt((value) => value + 1)}>{t("checkStatus")}</button>
      </div>}
    </>}
    <p className={styles.note}>{t("reportAfter")}</p>
    <p className={styles.footer}><Link href="/questionnaire/checkout">{t("back")}</Link></p>
  </CheckoutFrame>;
}
