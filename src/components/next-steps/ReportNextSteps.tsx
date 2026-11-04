import { ArrowRight } from "lucide-react";
import { getNextStepsCopy } from "@/content/nextSteps";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import styles from "./NextStepsPage.module.css";

export function ReportNextSteps({ locale }: { locale: AppLocale }) {
  const copy = getNextStepsCopy(locale);

  return (
    <section className={styles.reportInvite} aria-labelledby="report-next-step-title">
      <h2 id="report-next-step-title">{copy.inviteTitle}</h2>
      <p>{copy.inviteBody}</p>
      <Link href="/next-steps" className={styles.cta}>
        <span>{copy.inviteCta}</span><ArrowRight size={21} aria-hidden="true" />
      </Link>
    </section>
  );
}
