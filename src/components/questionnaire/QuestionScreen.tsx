import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Screen } from "@/lib/questionnaire";
import { MultiSelectQuestion } from "./MultiSelectQuestion";
import { SingleSelectQuestion } from "./SingleSelectQuestion";
import { TextReflectionQuestion } from "./TextReflectionQuestion";

export function QuestionScreen({
  screen,
  value,
  onChange,
  otherValue,
  onOtherChange,
}: {
  screen: Extract<Screen, { type: "question" }>;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  otherValue?: string;
  onOtherChange: (value: string) => void;
}) {
  const t = useTranslations("questionnaire");
  const ui = useTranslations("questionnaireUi");
  const common = useTranslations("common");
  const section = t(`sections.${screen.sectionId}`);
  const prompt = t(`screens.${screen.id}.prompt`);
  const helper = t.has(`screens.${screen.id}.helper`) ? t(`screens.${screen.id}.helper`) : undefined;
  const placeholder = t.has(`screens.${screen.id}.placeholder`)
    ? t(`screens.${screen.id}.placeholder`)
    : ui("defaultPlaceholder");
  const getLabel = (id: string) => t(`screens.${screen.id}.options.${id}`);
  const hasOther = typeof value === "string" ? value === "other" : value?.includes("other");

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.45 }}
      className="mx-auto max-w-3xl"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3C60]">
        {section}
      </p>
      <h1 className="mt-4 text-3xl font-semibold leading-tight text-[#352317] sm:text-4xl">
        {prompt}
      </h1>
      {helper && (
        <p className="mt-4 text-base leading-7 text-[#7a5a41]">{helper}</p>
      )}
      <div className="mt-8">
        {screen.questionType === "single" && (
          <SingleSelectQuestion
            options={screen.options ?? []}
            value={typeof value === "string" ? value : ""}
            onChange={onChange}
            getLabel={getLabel}
          />
        )}
        {screen.questionType === "multi" && (
          <MultiSelectQuestion
            options={screen.options ?? []}
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
            getLabel={getLabel}
          />
        )}
        {screen.questionType === "text" && (
          <TextReflectionQuestion
            value={typeof value === "string" ? value : ""}
            onChange={onChange}
            placeholder={placeholder}
          />
        )}
        {hasOther && (
          <div className="mt-4">
            <label className="sr-only" htmlFor={`${screen.id}-other`}>{common("other")}</label>
            <textarea
              id={`${screen.id}-other`}
              value={otherValue ?? ""}
              onChange={(event) => onOtherChange(event.target.value)}
              placeholder={common("otherPlaceholder")}
              className="min-h-28 w-full resize-y rounded-[8px] border border-[#ead5e2] bg-white/62 p-4 text-base leading-7 text-[#352317] outline-none transition placeholder:text-[#9b7a61] focus:border-[#A95888]"
            />
          </div>
        )}
      </div>
      {screen.optional && (
        <p className="mt-4 text-sm text-[#8f6240]">{ui("optional")}</p>
      )}
    </motion.div>
  );
}
