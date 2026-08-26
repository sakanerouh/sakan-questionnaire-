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
const truthImages = [
  "/truth-protection.jpeg",
  "/truth-compassion.jpeg",
  "/truth-reconnection.jpeg",
];

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
                  <Image
                    src={truthImages[index]}
                    alt=""
                    fill
                    sizes="(max-width: 560px) 180px, 200px"
                    className={styles.truthImage}
                  />
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
