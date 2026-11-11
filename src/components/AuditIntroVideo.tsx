"use client";

import { ArrowRight, ExternalLink, Play, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import styles from "./AuditIntroVideo.module.css";

const videoId = "i2loaCPP9MU";

export function AuditIntroVideo({ preview = false, onContinue, triggerContent, triggerClassName }: {
  preview?: boolean;
  onContinue?: () => void;
  triggerContent?: ReactNode;
  triggerClassName?: string;
}) {
  const t = useTranslations("auditVideo");
  const locale = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  const close = () => dialogRef.current?.close();

  return (
    <div className={triggerContent ? styles.ctaRoot : styles.root}>
      <button type="button" className={triggerClassName ?? (preview ? styles.preview : styles.trigger)} aria-haspopup="dialog" onClick={() => {
        dialogRef.current?.showModal();
        setOpen(true);
      }}>
        {triggerContent ?? (preview ? <>
          <span className={styles.thumbnail}>
            <Image src="/audit-introduction-preview-hd.jpg" alt="" fill sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1088px) calc(100vw - 48px), 1040px" />
            <span className={styles.previewPlay}><Play fill="currentColor" aria-hidden="true" /></span>
          </span>
          <span className={styles.previewCopy}>
            <span className={styles.previewTitle}>SakanBody Audit</span>
            <span className={styles.previewAction}>{t("watch")}<span className={styles.optional}>{t("optional")}</span></span>
          </span>
        </> : <>
          <span className={styles.play}><Play size={15} fill="currentColor" aria-hidden="true" /></span>
          <span className={styles.triggerText}>{t("trigger")}</span>
          <span className={styles.optional}>{t("optional")}</span>
        </>)}
      </button>

      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} aria-describedby={descriptionId}
        onClose={() => setOpen(false)} onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
        }}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{t("recommended")}</p>
            <h2 id={titleId} className={styles.title}>{t("title")}</h2>
          </div>
          <button type="button" className={styles.close} onClick={close} aria-label={t("close")} autoFocus>
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <p id={descriptionId} className={styles.description}>{t(onContinue ? "description" : "recommendation")}</p>
        <div className={styles.player}>
          {open && <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&playsinline=1&hl=${encodeURIComponent(locale)}`}
            title={t("frameTitle")}
            allow="encrypted-media; fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />}
        </div>
        <div className={styles.footer}>
          <div className={styles.fallback}>
            <p>{t("fallback")}</p>
            <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">
              {t("youtube")}<ExternalLink size={15} aria-hidden="true" />
            </a>
          </div>
          {onContinue ? (
            <button type="button" className={styles.continue} onClick={() => { close(); onContinue(); }}>
              {t("continue")}<ArrowRight size={19} aria-hidden="true" />
            </button>
          ) : (
            <Link href="/questionnaire/checkout" className={styles.continue} onClick={close}>
              {t("checkout")}<ArrowRight size={19} aria-hidden="true" />
            </Link>
          )}
        </div>
      </dialog>
    </div>
  );
}
