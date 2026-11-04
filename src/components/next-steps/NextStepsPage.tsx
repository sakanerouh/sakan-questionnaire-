import Image from "next/image";
import { ArrowRight, Clock3, Globe2, MessageCircle, Tag, UserRound } from "lucide-react";
import { getNextStepsCopy, nextStepsWhatsAppUrl } from "@/content/nextSteps";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import styles from "./NextStepsPage.module.css";

function BotanicalSprig({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 100 230" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
      <path d="M32 227C45 169 49 101 71 7M44 167C14 162 8 144 10 132c22 3 32 15 34 35Zm7-41c-29-9-33-27-28-40 20 8 29 22 28 40Zm9-43C38 69 36 49 44 39c15 12 20 27 16 44Zm6-28C60 34 64 17 77 4c5 20 2 37-11 51ZM40 187c19-27 36-28 49-24-10 18-25 27-49 24Zm8-43c15-25 32-30 44-27-7 20-22 29-44 27Zm9-45c12-25 26-31 38-30-5 20-17 30-38 30Z" />
    </svg>
  );
}

function Brand() {
  return (
    <div className={styles.brand}>
      <svg viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M28 49C13 37 17 21 28 6c11 15 15 31 0 43Z" />
        <path d="M28 49C11 48 4 37 4 25c14 2 22 10 24 24Zm0 0c17-1 24-12 24-24-14 2-22 10-24 24Z" />
        <path d="M28 49C15 44 10 33 12 17c8 4 13 10 16 18 3-8 8-14 16-18 2 16-3 27-16 32Z" />
      </svg>
      <span><span dir="ltr">Sakan eRouh</span><span lang="ar" dir="rtl" className={styles.arabicBrand}>سكن الروح</span></span>
    </div>
  );
}

export function NextStepsPage({ locale }: { locale: AppLocale }) {
  const copy = getNextStepsCopy(locale);
  const detailIcons = [Clock3, Tag, Globe2];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Brand />
          <nav className={styles.languages} aria-label={copy.languagesLabel}>
            <Link href="/next-steps" locale="en" lang="en" aria-current={locale === "en" ? "page" : undefined}>EN</Link>
            <span aria-hidden="true">/</span>
            <Link href="/next-steps" locale="ar" lang="ar" aria-current={locale === "ar" ? "page" : undefined}>العربية</Link>
          </nav>
        </header>

        <section className={styles.hero} aria-labelledby="next-steps-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h1 id="next-steps-title">{copy.heading} <span>{copy.headingAccent}</span></h1>
            <div className={styles.rule} aria-hidden="true" />
            <p className={styles.introduction}>{copy.introduction}</p>
          </div>
          <div className={styles.portrait}>
            <Image src="/next-steps/imane-sitting.jpeg" alt={copy.portraitAlt} fill preload sizes="(max-width: 640px) 100vw, 50vw" />
          </div>
        </section>

        <section className={styles.options} aria-labelledby="next-steps-options">
          <h2 id="next-steps-options">{copy.optionsHeading}</h2>
          <div className={styles.cards}>
            {copy.cards.map((card) => (
              <article key={card.id} className={`${styles.card} ${card.id === "journey" ? styles.featured : ""}`} aria-labelledby={`offer-${card.id}`}>
                <div className={styles.cardImage}>
                  <Image src={card.image} alt="" fill sizes="(max-width: 640px) 80vw, 260px" />
                </div>
                <div className={styles.cardCopy}>
                  <div className={styles.cardTop}>
                    <p className={styles.eyebrow}>{card.eyebrow}</p>
                    {card.badge && <span className={styles.badge}>{card.badge}</span>}
                  </div>
                  <h3 id={`offer-${card.id}`}>{card.title}</h3>
                  <p className={styles.cardBody}>{card.body}</p>
                  {card.details.length > 0 && (
                    <ul className={styles.details}>
                      {card.details.map((detail, index) => {
                        const Icon = card.id === "journey" ? UserRound : detailIcons[index];
                        return <li key={detail}><Icon size={18} strokeWidth={1.5} aria-hidden="true" /><span>{detail}</span></li>;
                      })}
                    </ul>
                  )}
                  <a className={styles.cta} href={nextStepsWhatsAppUrl(card.message)} target="_blank" rel="noopener noreferrer">
                    <span>{card.cta}</span><ArrowRight size={23} strokeWidth={1.4} aria-hidden="true" />
                  </a>
                </div>
                <BotanicalSprig className={styles.sprig} />
              </article>
            ))}
          </div>
        </section>

        <footer className={styles.footer}>
          <p className={styles.closing}>{copy.closing}</p>
          <p className={styles.whatsappNote}><MessageCircle size={15} aria-hidden="true" />{copy.whatsappNote}</p>
        </footer>
      </div>
    </main>
  );
}
