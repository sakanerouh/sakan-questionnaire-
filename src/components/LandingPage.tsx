"use client";

import * as Accordion from "@radix-ui/react-accordion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  HeartHandshake,
  LockKeyhole,
  Moon,
  Shield,
  Sparkles,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

const storyBeats = [
  {
    eyebrow: "First, the surface story",
    title: "Maybe you call it overthinking.",
    body: "But the body may be doing something more intelligent: preparing, proving, pleasing, or disappearing before old discomfort returns.",
    reveal: "The quiz starts where generic advice usually stops.",
    previewTitle: "The Anticipator",
    score: "86%",
    locks: ["Pressure scan", "Future rehearsal", "Safety planning"],
    icon: Eye,
    accent: "#A95888",
  },
  {
    eyebrow: "Then, the protection appears",
    title: "There is a reason your pattern repeats.",
    body: "Each answer helps reveal the protection style underneath your reactions, the one that once kept something tender safe.",
    reveal: "Protection is not the enemy. It is the doorway.",
    previewTitle: "Protection Map",
    score: "04",
    locks: ["Childhood role", "Current trigger", "Body strategy"],
    icon: Shield,
    accent: "#7C3C60",
  },
  {
    eyebrow: "Finally, the mirror opens",
    title: "Your report names the pattern without making you small.",
    body: "You receive an archetype, shadow clues, dream sabotage themes, and practices that feel personal enough to keep reading.",
    reveal: "Curiosity becomes a map.",
    previewTitle: "Full Report",
    score: "15",
    locks: ["Shadow themes", "Dream sabotage", "Practice path"],
    icon: Sparkles,
    accent: "#DDA8C8",
  },
];

const archetypeData = [
  { archetype: "Anticipator", score: 86 },
  { archetype: "Performer", score: 64 },
  { archetype: "Harmonizer", score: 72 },
  { archetype: "Quiter", score: 58 },
];

const faqs = [
  {
    question: "How long does it take?",
    answer: "Most people complete it in 10 to 15 minutes. It is reflective, but not endless.",
  },
  {
    question: "Is this therapy?",
    answer: "No. It is a self-reflection tool, not a diagnosis or a replacement for therapy, medical care, or crisis support.",
  },
  {
    question: "What do I get after the questionnaire?",
    answer: "A personalized report with your dominant archetype, secondary pattern, shadow themes, dream sabotage clues, and practices.",
  },
];

function PrimaryCTA({ children = "Take the Questionnaire" }: { children?: React.ReactNode }) {
  return (
    <Link
      href="/questionnaire/start"
      className="group sakan-gradient inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#fffaf2] shadow-[0_18px_45px_rgba(124,60,96,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(124,60,96,0.34)] focus:outline-none focus:ring-2 focus:ring-[#DDA8C8] focus:ring-offset-2 focus:ring-offset-[#fbf7ef]"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
    </Link>
  );
}

function ChartFrame({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return <div className="h-full w-full rounded-[8px] bg-[#f5e4ee]/70" />;
  }

  return children;
}

function StoryVisual({
  stateRefs,
  progressRef,
}: {
  stateRefs?: React.MutableRefObject<Array<HTMLDivElement | null>>;
  progressRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="relative min-h-[34rem] overflow-hidden rounded-[8px] border border-[#ead5e2] bg-[#fffaf2]/88 p-5 shadow-[0_28px_90px_rgba(124,60,96,0.16)] backdrop-blur sm:p-7">
      <div className="absolute inset-0 sakan-gradient-soft opacity-80" />
      <div className="relative">
        <div className="mb-6 overflow-hidden rounded-full bg-[#ead5e2]">
          <div
            ref={progressRef}
            className="sakan-gradient h-2 origin-left rounded-full"
            style={{ transform: "scaleX(0.33)" }}
          />
        </div>

        <div className="h-56">
          <ChartFrame>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={archetypeData}>
                <PolarGrid stroke="#e3cfe0" />
                <PolarAngleAxis dataKey="archetype" tick={{ fill: "#6c4b37", fontSize: 11 }} />
                <Radar dataKey="score" stroke="#7C3C60" fill="#A95888" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </div>

        <div className="relative mt-5 min-h-64">
          {storyBeats.map((beat, beatIndex) => (
            <div
              key={beat.previewTitle}
              ref={(node) => {
                if (stateRefs) {
                  stateRefs.current[beatIndex] = node;
                }
              }}
              className="absolute inset-0 rounded-[8px] border border-[#ead5e2] bg-white/72 p-4"
              style={{ opacity: beatIndex === 0 ? 1 : 0 }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#ead5e2] pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7C3C60]">
                    Live mirror
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-[#352317]">
                    {beat.previewTitle}
                  </h2>
                </div>
                <div className="sakan-gradient grid h-16 w-16 shrink-0 place-items-center rounded-full text-lg font-semibold text-[#fffaf2]">
                  {beat.score}
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {beat.locks.map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between gap-4 rounded-[8px] bg-[#fffaf2]/78 p-3 text-sm font-semibold text-[#6c4b37]"
                  >
                    {item}
                    <LockKeyhole className="h-4 w-4 shrink-0 text-[#A95888]" aria-hidden />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-[#7C3C60]">{beat.reveal}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroScene() {
  const heroRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || window.innerWidth < 1024) return;

    const context = gsap.context(() => {
      gsap.from(copyRef.current, {
        autoAlpha: 0,
        duration: 0.9,
        ease: "power3.out",
        y: 28,
      });
      gsap.from(cardRef.current, {
        autoAlpha: 0,
        delay: 0.12,
        duration: 1,
        ease: "power3.out",
        rotate: -2,
        scale: 0.96,
        y: 32,
      });
      gsap.to(glowRef.current, {
        ease: "none",
        scale: 1.12,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
        yPercent: 18,
      });
      gsap.to(cardRef.current, {
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
        yPercent: -8,
      });
    }, heroRef);

    return () => context.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative isolate min-h-screen overflow-hidden px-5 py-6 sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(255,250,242,0.96),rgba(253,238,247,0.9)_45%,rgba(221,168,200,0.34))]" />
      <div
        ref={glowRef}
        className="absolute inset-x-0 top-12 -z-10 mx-auto h-[34rem] max-w-5xl rounded-full bg-[radial-gradient(circle,rgba(221,168,200,0.5),rgba(169,88,136,0.17)_48%,transparent_70%)] blur-3xl"
      />

      <nav className="mx-auto flex max-w-7xl items-center justify-between py-4">
        <Link href="/" className="text-base font-semibold tracking-[0.24em] text-[#7C3C60] sm:text-lg">
          SAKAN EROUH
        </Link>
        <PrimaryCTA>Begin</PrimaryCTA>
      </nav>

      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div ref={copyRef}>
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.04] text-[#352317] sm:text-5xl lg:text-7xl">
            What if your pattern is not the problem?
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6c4b37] sm:text-xl">
            Scroll into the mirror. Notice the protection. Then take the questionnaire
            to discover the archetype shaping the way you love, protect, heal, and become.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryCTA />
            <a
              href="#story"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#DDA8C8]/70 bg-white/45 px-6 py-3 text-sm font-semibold text-[#7C3C60] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/75 focus:outline-none focus:ring-2 focus:ring-[#DDA8C8] focus:ring-offset-2 focus:ring-offset-[#fbf7ef]"
            >
              <ArrowDown className="h-4 w-4" aria-hidden />
              Follow the Story
            </a>
          </div>
        </div>

        <div ref={cardRef} className="relative">
          <div className="rounded-[8px] border border-[#ead5e2] bg-white/55 p-4 shadow-[0_30px_90px_rgba(124,60,96,0.18)] backdrop-blur-xl">
            <StoryVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

function ScrollyStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<Array<HTMLDivElement | null>>([]);
  const visualStateRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const context = gsap.context(() => {
      const textPanels = textRefs.current.filter(Boolean);
      const visualStates = visualStateRefs.current.filter(Boolean);

      gsap.set(textPanels, { autoAlpha: 0, y: 44 });
      gsap.set(textPanels[0], { autoAlpha: 1, y: 0 });
      gsap.set(visualStates, { autoAlpha: 0, scale: 0.96, y: 22 });
      gsap.set(visualStates[0], { autoAlpha: 1, scale: 1, y: 0 });
      gsap.set(progressRef.current, { scaleX: 1 / storyBeats.length });

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          anticipatePin: 1,
          end: () => `+=${storyBeats.length * 900}`,
          pin: pinRef.current,
          scrub: 0.85,
          start: "top top",
          trigger: sectionRef.current,
        },
      });

      storyBeats.forEach((_, index) => {
        const position = index;

        timeline.to(
          progressRef.current,
          {
            duration: 0.6,
            scaleX: (index + 1) / storyBeats.length,
          },
          position,
        );

        timeline.to(
          visualRef.current,
          {
            duration: 0.45,
            rotate: index % 2 === 0 ? 0 : -1.4,
            scale: index === storyBeats.length - 1 ? 1.03 : 1,
          },
          position,
        );

        if (index === 0) return;

        timeline
          .to(
            textPanels[index - 1],
            {
              autoAlpha: 0,
              duration: 0.32,
              y: -36,
            },
            position,
          )
          .fromTo(
            textPanels[index],
            { autoAlpha: 0, y: 44 },
            { autoAlpha: 1, duration: 0.42, y: 0 },
            position + 0.12,
          )
          .to(
            visualStates[index - 1],
            {
              autoAlpha: 0,
              duration: 0.28,
              scale: 0.96,
              y: -18,
            },
            position,
          )
          .fromTo(
            visualStates[index],
            { autoAlpha: 0, scale: 1.04, y: 24 },
            { autoAlpha: 1, duration: 0.42, scale: 1, y: 0 },
            position + 0.12,
          );
      });
    }, sectionRef);

    return () => context.revert();
  }, []);

  return (
    <section ref={sectionRef} id="story" className="relative px-5 py-10 sm:px-8 lg:px-12">
      <div ref={pinRef} className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div ref={visualRef}>
          <StoryVisual stateRefs={visualStateRefs} progressRef={progressRef} />
        </div>

        <div className="relative lg:min-h-[34rem]">
          {storyBeats.map((beat, index) => {
            const Icon = beat.icon;

            return (
              <div
                key={beat.title}
                ref={(node) => {
                  textRefs.current[index] = node;
                }}
                className="relative mb-6 flex min-h-[24rem] items-center lg:absolute lg:inset-0 lg:mb-0 lg:min-h-0"
              >
                <div className="max-w-xl">
                  <div
                    className="mb-6 grid h-14 w-14 place-items-center rounded-full text-[#fffaf2] shadow-[0_16px_40px_rgba(124,60,96,0.18)]"
                    style={{ background: beat.accent }}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3C60]">
                    0{index + 1} / {beat.eyebrow}
                  </p>
                  <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#352317] sm:text-5xl">
                    {beat.title}
                  </h2>
                  <p className="mt-5 text-lg leading-8 text-[#6c4b37]">{beat.body}</p>
                  <p className="mt-6 rounded-[8px] border border-[#ead5e2] bg-white/58 p-4 text-base font-semibold leading-7 text-[#7C3C60]">
                    {beat.reveal}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
function CuriosityBridge() {
  return (
    <section className="px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="sakan-gradient-deep rounded-[8px] border border-[#DDA8C8]/35 p-7 text-[#fffaf2] shadow-[0_30px_90px_rgba(124,60,96,0.28)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f8d7ea]">
            The question that changes the scroll
          </p>
          <h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-5xl">
            Which part of you learned to keep watch?
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#f8ead7]">
            The questionnaire is built like a conversation with that part. It asks
            enough to create recognition, but not so much that you feel analyzed.
          </p>
          <div className="mt-8">
            <PrimaryCTA>Find My Pattern</PrimaryCTA>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: Waves, title: "Body pattern", text: "How your system reacts before your mind explains it." },
            { icon: HeartHandshake, title: "Relationship logic", text: "What you do to stay loved, safe, useful, or unseen." },
            { icon: Moon, title: "Shadow clue", text: "The aliveness that got exiled because it felt risky." },
            { icon: CheckCircle2, title: "Practice path", text: "A next step that respects the protection instead of shaming it." },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="rounded-[8px] border border-[#ead5e2] bg-white/58 p-5 shadow-[0_18px_50px_rgba(124,60,96,0.08)]">
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-full bg-[#f5e4ee] text-[#7C3C60]">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-[#352317]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#6c4b37]">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalInvitation() {
  return (
    <section className="px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3C60]">
          Your mirror is waiting
        </p>
        <h2 className="mt-5 text-4xl font-semibold leading-tight text-[#352317] sm:text-6xl">
          You do not need another label. You need a pattern you can finally recognize.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#6c4b37]">
          Start with one answer. The rest of the story opens from there.
        </p>
        <div className="mt-8">
          <PrimaryCTA>Start the Questionnaire</PrimaryCTA>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section className="px-5 pb-28 sm:px-8 lg:px-12">
      <Accordion.Root type="single" collapsible className="mx-auto max-w-3xl space-y-3">
        {faqs.map((faq, index) => (
          <Accordion.Item
            key={faq.question}
            value={`item-${index}`}
            className="rounded-[8px] border border-[#ead5e2] bg-white/55 px-5 shadow-[0_14px_45px_rgba(124,60,96,0.06)]"
          >
            <Accordion.Header>
              <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left text-base font-semibold text-[#352317]">
                {faq.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-[#7C3C60] transition group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="overflow-hidden pb-5 text-sm leading-7 text-[#6c4b37] data-[state=closed]:animate-none">
              {faq.answer}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
}

function StickyCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#DDA8C8]/55 bg-[#fffaf2]/88 p-3 shadow-[0_-16px_40px_rgba(124,60,96,0.14)] backdrop-blur md:hidden">
      <Link
        href="/questionnaire/start"
        className="sakan-gradient flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#fffaf2]"
      >
        Take the Questionnaire
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="relative overflow-hidden pb-20 md:pb-0">
      <div className="grain" />
      <HeroScene />
      <ScrollyStory />
      <CuriosityBridge />
      <FinalInvitation />
      <FAQ />
      <StickyCTA />
    </main>
  );
}
