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
      <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3C60]">
        {ui("featuredReflection")}
      </p>
      <h1 className="mt-4 text-center text-4xl font-semibold leading-tight text-[#352317] sm:text-5xl">
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-8 text-[#6c4b37]">
        {body}
      </p>
      <div className="mt-9 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <div className="rounded-[8px] border border-[#e4cda9] bg-white/62 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3C60]">
            {ui("childhoodProtection")}
          </p>
          <ul className="mt-4 space-y-3 text-base leading-7 text-[#5d402d]">
            {(childhood.length ? childhood : [ui("childhoodPending")]).map((item) => (
              <li key={item}>{childhood.length ? label(childhoodQuestionId, item) : item}</li>
            ))}
          </ul>
        </div>
        <div className="grid place-items-center text-[#A95888]">
          <ArrowRight className="hidden h-8 w-8 md:block" aria-hidden />
        </div>
        <div className="sakan-gradient-deep rounded-[8px] border border-[#DDA8C8]/45 p-5 text-[#fffaf2]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f8d7ea]">
            {ui("sabotageNow")}
          </p>
          <ul className="mt-4 space-y-3 text-base leading-7 text-[#f8ead7]">
            {(sabotage.length ? sabotage : [ui("sabotagePending")]).map((item) => (
              <li key={item}>{sabotage.length ? label(sabotageQuestionId, item) : item}</li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
