"use client";

import { AnimatePresence, motion, useInView, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import dynamic from "next/dynamic";
import { useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { ChapterHead, serif, type T } from "./shared";

const PeatScene = dynamic(() => import("./PeatScene"), { ssr: false });

const STEPS = [
  ["p1T", "p1B"],
  ["p2T", "p2B"],
  ["p3T", "p3B"],
  ["p4T", "p4B"],
  ["p5T", "p5B"],
] as const;

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
const noop = () => () => {};

/** Tall section with a pinned 3D cutaway whose story is driven by scroll. */
export default function PeatChapter({ t, scroller }: { t: T; scroller: RefObject<HTMLDivElement | null> }) {
  const section = useRef<HTMLElement>(null);
  const near = useInView(section, { root: scroller, margin: "200px 0px 200px 0px" });
  const reduced = useReducedMotion() ?? false;
  const gl = useSyncExternalStore(noop, hasWebGL, () => true);
  const { scrollYProgress } = useScroll({ container: scroller, target: section, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)))));

  const [title, body] = STEPS[step];

  return (
    <section data-ch="3" id="ch-3" ref={section} className="relative h-[420vh] bg-[#1d3248] text-[#f1ece3]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0">{gl && <PeatScene progress={scrollYProgress} active={near} still={reduced} />}</div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/70 via-transparent to-ink/85" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-between px-6 pb-8 pt-20 sm:px-10 sm:pb-12 sm:pt-24">
          <ChapterHead n={3} kicker={t("c4Kicker")} title={t("c4Title")} />

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-xl" aria-live="polite">
              <div className="flex gap-1.5" aria-hidden="true">
                {STEPS.map((_, i) => (
                  <span key={i} className={`h-[3px] w-10 transition-colors duration-300 ${i <= step ? "bg-ember" : "bg-white/25"}`} />
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <h3 className={`${serif} mt-4 text-3xl leading-tight sm:text-5xl`}>{t(title)}</h3>
                  <p className="mt-3 text-sm leading-relaxed opacity-85 sm:text-base">{t(body)}</p>
                </motion.div>
              </AnimatePresence>
              {!gl && <p className="mt-4 text-sm text-amber-200">{t("noGl")}</p>}
            </div>

            <ul className="hidden gap-x-6 text-xs opacity-80 sm:flex lg:flex-col lg:gap-y-2">
              <li className="flex items-center gap-2">
                <span className="h-[3px] w-5 bg-[#5ec8ff]" />
                {t("legWater")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-3 w-5 bg-[#7a5a3a]" />
                {t("legPeat")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-3 w-5 bg-gradient-to-r from-[#3a0d03] via-[#ff6a1f] to-[#ffd27a]" />
                {t("legFire")}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
