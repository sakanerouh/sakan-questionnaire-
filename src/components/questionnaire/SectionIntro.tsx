import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45 }}
      className="mx-auto max-w-3xl text-center"
    >
      <div className="sakan-gradient mx-auto grid h-14 w-14 place-items-center rounded-full text-[#fffaf2]">
        <Sparkles className="h-6 w-6" aria-hidden />
      </div>
      {eyebrow && (
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3C60]">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#352317] sm:text-5xl">
        {title}
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#6c4b37]">
        {body}
      </p>
    </motion.div>
  );
}
