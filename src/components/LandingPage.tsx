"use client";

import Image from "next/image";
import localFont from "next/font/local";
import { ArrowRight, ClipboardPenLine, Compass, FileText, Heart, ShieldCheck, Sprout, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AuditIntroVideo } from "./AuditIntroVideo";
import styles from "./LandingPage.module.css";

// Bundle Lora so builds do not depend on Google Fonts URL parsing.
const landingSerif = localFont({
  src: "../assets/fonts/lora/Lora-Latin-Variable.woff2",
  weight: "400 500",
  style: "normal",
  variable: "--font-landing-serif",
  display: "swap",
});

const stepIcons = [ClipboardPenLine, FileText, Compass];
const pillarIcons = [Lotus, Sprout, ShieldCheck, Sun];
const truthImages = ["/truth-protection.jpeg", "/truth-compassion.jpeg", "/truth-reconnection.jpeg"];

function Lotus() {
  return (
    <svg viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M28 49C13 37 17 21 28 6c11 15 15 31 0 43Z" />
      <path d="M28 49C11 48 4 37 4 25c14 2 22 10 24 24Zm0 0c17-1 24-12 24-24-14 2-22 10-24 24Z" />
      <path d="M28 49C15 44 10 33 12 17c8 4 13 10 16 18 3-8 8-14 16-18 2 16-3 27-16 32Z" />
    </svg>
  );
}

function BotanicalBranch({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 150 210" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M29 208C48 143 67 76 117 12M50 144l-21-33m35-7-10-38m29 3-1-35m-7 42 36-9M58 120l39-13M42 167l40-15" />
      <path d="M117 12c-23 6-27 20-27 36 17-8 28-19 27-36ZM82 34c-14 9-13 23-3 36 7-15 8-26 3-36ZM54 66c-14 14-7 28 10 38 3-15 0-28-10-38ZM29 111c-10 18-2 30 20 34-1-16-7-27-20-34ZM111 67c-20-3-32 8-36 22 18 0 32-6 36-22ZM97 107c-20-6-32 1-39 13 16 7 30 1 39-13ZM82 152c-19-7-32 1-40 15 19 3 33-1 40-15Z" />
    </svg>
  );
}

function AuditButton({ final = false }: { final?: boolean }) {
  const t = useTranslations("landing.reference");
  return (
    <AuditIntroVideo
      triggerClassName={`${styles.auditButton} ${final ? styles.finalButton : ""}`}
      triggerContent={<><span>{t(final ? "finalCta" : "primaryCta")}</span><ArrowRight aria-hidden="true" strokeWidth={1.4} /></>}
    />
  );
}

export function LandingPage() {
  const t = useTranslations("landing.reference");
  const original = useTranslations("landing");
  const patterns = t.raw("patterns") as { title: string; body: string }[];
  const steps = t.raw("steps") as string[];
  const pillars = t.raw("pillars") as string[];

  return (
    <main className={`${styles.page} ${landingSerif.variable}`}>
      <section className={styles.hero} aria-labelledby="audit-title">
        <Image src="/sakanbody-hero.jpeg" alt={original("heroImageAlt")} fill preload sizes="100vw" className={styles.heroImage} />
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label={t("homeLabel")}>
            <Lotus /><span dir="ltr">Sakan eRouh</span>
          </Link>
          <LanguageSwitcher theme="olive" />
        </header>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{t("eyebrow")}<span aria-hidden="true" /></p>
          <h1 id="audit-title"><span>{t("titleStart")}</span> <span>{t("titleEnd")}</span></h1>
          <p className={styles.heroBody}>{t("heroBody")}</p>
          <AuditButton />
          <p className={styles.auditDetails}>{t("auditDetails")}</p>
        </div>
      </section>

      <section className={styles.patterns} aria-labelledby="patterns-title">
        <div className={styles.sectionHeading}>
          <div className={styles.heartDivider} aria-hidden="true"><span /><Heart strokeWidth={1.2} /><span /></div>
          <h2 id="patterns-title">{t("patternsTitle")}</h2>
        </div>
        <div className={styles.patternGrid}>
          {patterns.map((pattern, index) => (
            <article className={styles.pattern} key={pattern.title}>
              <div className={styles.patternImage}>
                <Image src={truthImages[index]} alt="" fill sizes="(max-width: 640px) 240px, (max-width: 1100px) 30vw, 320px" />
              </div>
              <h3>{pattern.title}</h3><p>{pattern.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.understanding} aria-labelledby="understanding-title">
        <div className={styles.plant} aria-hidden="true">
          <BotanicalBranch className={styles.plantBranch} /><BotanicalBranch className={styles.secondBranch} />
          <svg className={styles.vase} viewBox="0 0 140 140" fill="none">
            <defs><radialGradient id="vase-glaze" cx=".3" cy=".3" r=".8"><stop stopColor="#e7d1b5" /><stop offset=".65" stopColor="#c7a281" /><stop offset="1" stopColor="#9e785c" /></radialGradient></defs>
            <ellipse cx="70" cy="132" rx="60" ry="6" fill="#8d6b48" opacity=".13" />
            <path d="M46 6c-5 6 3 13 1 24-2 10-27 18-30 51-3 35 18 49 53 49s56-14 53-49c-3-33-28-41-30-51-2-11 6-18 1-24Z" fill="url(#vase-glaze)" />
            <ellipse cx="70" cy="6" rx="24" ry="5" fill="#9b7a5a" /><ellipse cx="70" cy="5" rx="19" ry="2" fill="#6d573d" />
          </svg>
        </div>
        <div className={styles.understandingCopy}>
          <h2 id="understanding-title">{t("understandingTitle")}</h2><p>{t("understandingBody")}</p>
        </div>
        <ol className={styles.steps}>
          {steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <li className={styles.step} key={step}>
                <span className={styles.stepIcon}><Icon aria-hidden="true" strokeWidth={1.2} /></span><span>{step}</span>
                {index < steps.length - 1 && <ArrowRight className={styles.stepArrow} aria-hidden="true" strokeWidth={1} />}
              </li>
            );
          })}
        </ol>
      </section>

      <section className={styles.closing} aria-label={t("closingLabel")}>
        <div className={styles.quote}>
          <span className={styles.quoteMark} aria-hidden="true">“</span><blockquote>{t("quote")}</blockquote><BotanicalBranch className={styles.quoteBranch} />
        </div>
        <div className={styles.pillars}>
          {pillars.map((pillar, index) => {
            const Icon = pillarIcons[index];
            return <div key={pillar}><Icon aria-hidden="true" strokeWidth={1.2} /><span>{pillar}</span></div>;
          })}
        </div>
        <AuditButton final /><p className={styles.siteName}>sakanerouh.com</p>
      </section>
      <footer className={styles.footer}><p>{original("disclaimer")}</p></footer>
    </main>
  );
}
