import { motion } from "framer-motion";
import type { Screen } from "@/lib/questionnaire";
import { MultiSelectQuestion } from "./MultiSelectQuestion";
import { SingleSelectQuestion } from "./SingleSelectQuestion";
import { TextReflectionQuestion } from "./TextReflectionQuestion";

export function QuestionScreen({
  screen,
  value,
  onChange,
}: {
  screen: Extract<Screen, { type: "question" }>;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.45 }}
      className="mx-auto max-w-3xl"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3C60]">
        {screen.section}
      </p>
      <h1 className="mt-4 text-3xl font-semibold leading-tight text-[#352317] sm:text-4xl">
        {screen.prompt}
      </h1>
      {screen.helper && (
        <p className="mt-4 text-base leading-7 text-[#7a5a41]">{screen.helper}</p>
      )}
      <div className="mt-8">
        {screen.questionType === "single" && (
          <SingleSelectQuestion
            options={screen.options ?? []}
            value={typeof value === "string" ? value : ""}
            onChange={onChange}
          />
        )}
        {screen.questionType === "multi" && (
          <MultiSelectQuestion
            options={screen.options ?? []}
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
          />
        )}
        {screen.questionType === "text" && (
          <TextReflectionQuestion
            value={typeof value === "string" ? value : ""}
            onChange={onChange}
            placeholder={screen.placeholder}
          />
        )}
      </div>
      {screen.optional && (
        <p className="mt-4 text-sm text-[#8f6240]">This reflection is optional. You may continue when ready.</p>
      )}
    </motion.div>
  );
}
