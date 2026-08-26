import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Answers } from "@/lib/schemas";

const asArray = (value: unknown) => (Array.isArray(value) ? value : []);

export function FeaturedReflectionScreen({
  title,
  body,
  childhoodQuestionId,
  sabotageQuestionId,
  answers,
}: {
  title: string;
  body: string;
  childhoodQuestionId: string;
  sabotageQuestionId: string;
  answers: Answers;
}) {
  const t = useTranslations("questionnaire");
  const ui = useTranslations("questionnaireUi");
  const childhood = asArray(answers[childhoodQuestionId]);
  const sabotage = asArray(answers[sabotageQuestionId]);
  const label = (questionId: string, id: string) =>
    t.has(`screens.${questionId}.options.${id}`) ? t(`screens.${questionId}.options.${id}`) : id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.45 }}
      className="mx-auto max-w-5xl"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-[#82542A]">
        {ui("featuredReflection")}
      </p>
      <h1 className="mt-4 text-center text-4xl font-semibold leading-tight text-[#28301C] sm:text-5xl">
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-8 text-[#464840]">
        {body}
      </p>
      <div className="mt-9 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <div className="rounded-[8px] border border-[#C6C7BD] bg-[#FBF9F8]/72 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#82542A]">
            {ui("childhoodProtection")}
          </p>
          <ul className="mt-4 space-y-3 text-base leading-7 text-[#464840]">
            {(childhood.length ? childhood : [ui("childhoodPending")]).map((item) => (
              <li key={item}>{childhood.length ? label(childhoodQuestionId, item) : item}</li>
            ))}
          </ul>
        </div>
        <div className="grid place-items-center text-[#82542A]">
          <ArrowRight className="hidden h-8 w-8 md:block" aria-hidden />
        </div>
        <div className="rounded-[8px] border border-[#ABB499]/45 bg-[#28301C] p-5 text-[#FBF9F8]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#DDE6C9]">
            {ui("sabotageNow")}
          </p>
          <ul className="mt-4 space-y-3 text-base leading-7 text-[#E7E2D9]">
            {(sabotage.length ? sabotage : [ui("sabotagePending")]).map((item) => (
              <li key={item}>{sabotage.length ? label(sabotageQuestionId, item) : item}</li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
