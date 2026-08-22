"use client";

import Image from "next/image";
import {
  ArrowRight,
  Check,
  ClipboardPenLine,
  Compass,
  FileText,
  Globe2,
  Heart,
  Leaf,
  LockKeyhole,
  Scale,
  ShieldCheck,
  Sparkles,
  Sprout,
  Timer,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import styles from "./LandingPage.module.css";

type Truth = { title: string; body: string };
type Step = { title: string; body: string };

const stepIcons = [ClipboardPenLine, FileText, Compass];
const pillarIcons = [Sprout, ShieldCheck, Heart, Sparkles];
const receiveIcons = [UsersRound, Sprout, Scale, Compass];

function TruthIllustration({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg className={styles.narrativeIcon} viewBox="0 0 200 210" aria-hidden>
        <path d="M100 40c17 13 35 15 48 17v43c0 35-22 57-48 70-26-13-48-35-48-70V57c13-2 31-4 48-17Z" />
        <circle cx="100" cy="75" r="12" />
        <path d="M76 124c3-20 13-31 24-31s21 11 24 31" />
        <path d="M46 145c-10-7-18-18-20-31M154 145c10-7 18-18 20-31" className={styles.illustrationAccent} />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg className={styles.narrativeIcon} viewBox="0 0 200 210" aria-hidden>
        <circle cx="101" cy="61" r="21" />
        <path d="M70 156c2-40 10-70 31-70s29 30 31 70" />
        <path d="M65 102c12 17 24 27 36 31 12-4 24-14 36-31" />
        <path d="M90 118c-10 3-18 0-24-7M112 118c10 3 18 0 24-7" className={styles.illustrationAccent} />
        <circle cx="152" cy="56" r="18" className={styles.illustrationSun} />
      </svg>
    );
  }

  return (
    <svg className={styles.narrativeIcon} viewBox="0 0 200 210" aria-hidden>
      <circle cx="67" cy="72" r="17" />
      <circle cx="133" cy="72" r="17" />
      <path d="M38 154c2-36 11-61 29-61 16 0 27 18 33 43 6-25 17-43 33-43 18 0 27 25 29 61" />
      <path d="M77 119c9 2 16 8 23 17 7-9 14-15 23-17" className={styles.illustrationAccent} />
      <path d="M100 111c-15-15-31-4-31 9 0 13 17 24 31 34 14-10 31-21 31-34 0-13-16-24-31-9Z" />
    </svg>
  );
}

function AuditButton({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("landing");

  return (
    <Link href="/questionnaire/start" className={compact ? styles.compactCta : styles.primaryCta}>
      <span>{compact ? t("navCta") : t("primaryCta")}</span>
      <ArrowRight aria-hidden size={compact ? 16 : 18} strokeWidth={1.7} />
    </Link>
  );
}

function BrandMark() {
  return (
    <Link href="/" className={styles.brand} aria-label="Sakan eRouh home">
      <span className={styles.brandIcon} aria-hidden>
        <Leaf size={16} strokeWidth={1.5} />
      </span>
      <span>
        SAKAN <i>e</i>ROUH
      </span>
    </Link>
  );
}

export function LandingPage() {
  const t = useTranslations("landing");
  const truths = t.raw("truths") as Truth[];
  const steps = t.raw("steps") as Step[];
  const receive = t.raw("receiveItems") as string[];
  const pillars = t.raw("pillars") as string[];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <BrandMark />
          <div className={styles.headerActions}>
            <LanguageSwitcher theme="olive" />
            <AuditButton compact />
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{t("heroEyebrow")}</p>
          <h1>{t("heroTitle")}</h1>
          <p className={styles.heroSubtitle}>{t("heroSubtitle")}</p>
          <p className={styles.heroBody}>{t("heroBody")}</p>

          <div className={styles.meta} aria-label={t("detailsLabel")}>
            <span><Timer aria-hidden size={19} />{t("duration")}</span>
            <span><FileText aria-hidden size={19} />{t("report")}</span>
            <span><Globe2 aria-hidden size={19} />{t("languages")}</span>
          </div>

          <div className={styles.heroAction}>
            <AuditButton />
            <p><LockKeyhole aria-hidden size={14} />{t("secure")}</p>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.photoArch}>
            <Image
              src="/sakanbody-portrait.jpeg"
              alt={t("heroImageAlt")}
              width={1600}
              height={900}
              priority
              sizes="100vw"
              className={styles.heroImage}
            />
          </div>
        </div>
      </section>

      <section className={styles.truths} id="truths">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>{t("truthsEyebrow")}</p>
          <h2>{t("truthsTitle")}</h2>
        </div>
        <div className={styles.truthGrid}>
          {truths.map((truth, index) => {
            return (
              <article className={styles.truthCard} key={truth.title}>
                <div className={styles.truthIllustration}>
                  <div className={styles.truthHalo} />
                  <TruthIllustration index={index} />
                  <Leaf className={styles.truthLeaf} aria-hidden size={34} strokeWidth={0.9} />
                </div>
                <div className={styles.truthCopy}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{truth.title}</h3>
                    <p>{truth.body}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.valueSection}>
        <div className={styles.valueCopy}>
          <p className={styles.eyebrow}>{t("receiveEyebrow")}</p>
          <h2>{t("receiveTitle")}</h2>
          <p className={styles.valueIntro}>{t("receiveIntro")}</p>
          <ul>
            {receive.map((item, index) => {
              const Icon = receiveIcons[index] ?? Check;
              return <li key={item}><span><Icon aria-hidden size={17} /></span>{item}</li>;
            })}
          </ul>
        </div>

        <div className={styles.stepsPanel}>
          <p className={styles.eyebrow}>{t("stepsEyebrow")}</p>
          <div className={styles.steps}>
            {steps.map((step, index) => {
              const Icon = stepIcons[index];
              return (
                <article className={styles.step} key={step.title}>
                  <div className={styles.stepIcon}><Icon aria-hidden size={29} strokeWidth={1.25} /></div>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.testimonialSection}>
        <div className={styles.testimonial}>
          <Heart aria-hidden size={25} strokeWidth={1.25} />
          <blockquote>“{t("testimonialQuote")}”</blockquote>
          <p>— {t("testimonialAuthor")}</p>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <p className={styles.eyebrow}>{t("finalEyebrow")}</p>
          <h2>{t("finalTitle")}</h2>
          <p>{t("finalBody")}</p>
        </div>
        <div className={styles.finalAction}>
          <AuditButton />
          <small><LockKeyhole aria-hidden size={13} />{t("secure")}</small>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.pillars}>
          {pillars.map((pillar, index) => {
            const Icon = pillarIcons[index];
            return <div key={pillar}><Icon aria-hidden size={24} strokeWidth={1.2} /><span>{pillar}</span></div>;
          })}
        </div>
        <div className={styles.footerBottom}>
          <BrandMark />
          <p>{t("disclaimer")}</p>
          <span>© {new Date().getFullYear()} Sakan eRouh</span>
        </div>
      </footer>

      <div className={styles.mobileCta}>
        <AuditButton />
      </div>
    </main>
  );
}
