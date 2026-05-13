"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { archetypeOrder, archetypes, type ArchetypeId } from "@/lib/archetypes";

export function ArchetypeChart({
  distribution,
}: {
  distribution: Record<ArchetypeId, number>;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const data = archetypeOrder.map((id) => ({
    name: archetypes[id].name.replace("The ", ""),
    value: distribution[id],
    fill: archetypes[id].color,
  }));

  if (!mounted) {
    return <div className="h-72 rounded-[8px] bg-[#f5e4ee]" />;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -24, right: 12, top: 10, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fill: "#6c4b37", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, 100]} />
          <Tooltip
            cursor={{ fill: "rgba(221,168,200,0.14)" }}
            contentStyle={{
              background: "#fffaf2",
              border: "1px solid #ead5e2",
              borderRadius: 8,
              color: "#352317",
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
