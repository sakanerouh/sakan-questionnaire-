"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { archetypes } from "@/lib/archetypes";
import type { SakanResult } from "@/lib/schemas";
import { ArchetypeChart } from "./ArchetypeChart";
import { LockedPreviewCard } from "./LockedPreviewCard";
import { PaymentWall } from "./PaymentWall";

export function ResultTeaser({
  result,
}: {
  result: SakanResult;
}) {
  const t = useTranslations("resultUi");
  const roles = useTranslations("archetypes");
  const dominant = archetypes[result.dominant];
  const Icon = dominant.icon;
  const dominantName = roles(`${result.dominant}.name`);
  const secondaryName = roles(`${result.secondary}.name`);
  const opening = t("opening", { dominant: dominantName, secondary: secondaryName });
  const lockedSections = t.raw("lockedSections") as string[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3C60]">
          {t("identified")}
        </p>
        <div className="mt-5 rounded-[8px] border border-[#dfc59b] bg-[#fffaf2]/82 p-6 shadow-[0_28px_80px_rgba(75,47,32,0.12)] sm:p-8">
          <div className="flex items-start gap-4">
            <div className="sakan-gradient grid h-14 w-14 shrink-0 place-items-center rounded-full text-[#fffaf2]">
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-4xl font-semibold leading-tight text-[#352317] sm:text-5xl">
                {dominantName}
              </h1>
              <p className="mt-3 text-lg leading-8 text-[#6c4b37]">{roles(`${result.dominant}.short`)}</p>
            </div>
          </div>
          <div className="mt-8">
            <ArchetypeChart scores={result.scores} />
          </div>
          <div className="sakan-gradient-soft mt-6 rounded-[8px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3C60]">
              {t("patternNote")}
            </p>
            <p className="mt-3 text-base leading-8 text-[#5d402d]">{opening}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {lockedSections.map((title) => (
            <LockedPreviewCard key={title} title={title} />
          ))}
        </div>
      </div>
      <div className="lg:sticky lg:top-6 lg:self-start">
        <PaymentWall reportId={result.id} />
      </div>
    </motion.div>
  );
}
