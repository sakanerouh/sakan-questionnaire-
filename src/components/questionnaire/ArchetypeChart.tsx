"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { archetypeOrder, archetypes, type ArchetypeId } from "@/lib/archetypes";
import { roleScoreValue } from "@/lib/protectiveRoleCopy";

export function ArchetypeChart({
  scores,
}: {
  scores: Record<ArchetypeId, number>;
}) {
  const roles = useTranslations("archetypes");
  const resultUi = useTranslations("resultUi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const data = archetypeOrder.map((id) => ({
    name: roles(`${id}.name`),
    value: roleScoreValue(scores[id]),
    fill: archetypes[id].color,
  }));

  if (!mounted) {
    return <div className="h-72 rounded-[8px] bg-[#EFeded]" />;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -24, right: 12, top: 10, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fill: "#464840", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, 100]} />
          <Tooltip
            formatter={(value) => [`${value}/100`, resultUi("intensityScore")]}
            cursor={{ fill: "rgba(171,180,153,0.18)" }}
            contentStyle={{
              background: "#FBF9F8",
              border: "1px solid #C6C7BD",
              borderRadius: 8,
              color: "#28301C",
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((item) => (
              <Cell key={item.name} fill={item.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
