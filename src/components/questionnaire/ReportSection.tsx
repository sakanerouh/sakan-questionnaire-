import type { ReportBlock } from "@/lib/report";

export function ReportSection({ block }: { block: ReportBlock }) {
  return (
    <section className="rounded-[8px] border border-[#e4cda9] bg-[#fffaf2]/78 p-6 shadow-[0_18px_55px_rgba(75,47,32,0.08)] sm:p-8">
      <h2 className="text-2xl font-semibold text-[#352317]">{block.title}</h2>
      <p className="mt-4 text-base leading-8 text-[#5d402d]">{block.body}</p>
      {block.bullets && block.bullets.length > 0 && (
        <ul className="mt-5 grid gap-3">
          {block.bullets.map((item) => (
            <li key={item} className="rounded-[8px] bg-white/58 p-4 text-sm leading-6 text-[#6c4b37]">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
