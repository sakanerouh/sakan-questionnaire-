"use client";

import { motion } from "framer-motion";
import { archetypes } from "@/lib/archetypes";
import type { Answers, SakanResult } from "@/lib/schemas";
import { buildReportBlocks } from "@/lib/report";
import { ArchetypeChart } from "./ArchetypeChart";
import { LockedPreviewCard } from "./LockedPreviewCard";
import { PaymentWall } from "./PaymentWall";

export function ResultTeaser({
  result,
  answers,
}: {
  result: SakanResult;
  answers: Answers;
}) {
  const dominant = archetypes[result.dominant];
  const Icon = dominant.icon;
  const opening = buildReportBlocks(answers, result)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3C60]">
          Your dominant archetype has been identified.
        </p>
        <div className="mt-5 rounded-[8px] border border-[#dfc59b] bg-[#fffaf2]/82 p-6 shadow-[0_28px_80px_rgba(75,47,32,0.12)] sm:p-8">
          <div className="flex items-start gap-4">
            <div className="sakan-gradient grid h-14 w-14 shrink-0 place-items-center rounded-full text-[#fffaf2]">
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-4xl font-semibold leading-tight text-[#352317] sm:text-5xl">
                {dominant.name}
              </h1>
              <p className="mt-3 text-lg leading-8 text-[#6c4b37]">{dominant.short}</p>
            </div>
          </div>
          <div className="mt-8">
            <ArchetypeChart distribution={result.distribution} />
          </div>
          <div className="sakan-gradient-soft mt-6 rounded-[8px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3C60]">
              Free insight
            </p>
            <p className="mt-3 text-base leading-8 text-[#5d402d]">{opening.body}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            "Protection Pattern",
            "Shadow Personality",
            "Dream Sabotage Pattern",
            "Nervous System Update",
            "Personalized Practices",
            "Identity Inquiry",
          ].map((title) => (
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
