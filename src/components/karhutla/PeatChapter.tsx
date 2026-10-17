"use client";

import { AnimatePresence, motion, useInView, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import dynamic from "next/dynamic";
import { useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { Heading, type T } from "./shared";

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
    <section id="ch-3" ref={section} className="relative h-[520vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[#1d3248]">
          {gl && <PeatScene progress={scrollYProgress} active={near} still={reduced} />}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-between px-6 pb-10 pt-24">
          <Heading kicker={t("c4Kicker")} title={t("c4Title")} />

          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-md rounded-2xl border border-white/15 bg-black/55 p-6 backdrop-blur-md" aria-live="polite">
              <p className="font-mono text-[11px] uppercase tracking-widest text-orange-300">
                {step + 1} / {STEPS.length}
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <h3 className="mt-2 text-2xl font-semibold text-white">{t(title)}</h3>
                  <p className="mt-3 leading-relaxed text-stone-200">{t(body)}</p>
                </motion.div>
              </AnimatePresence>
              {!gl && <p className="mt-4 text-sm text-amber-200">{t("noGl")}</p>}
            </div>

            <div className="rounded-xl border border-white/15 bg-black/55 p-4 text-sm text-stone-200 backdrop-blur-md">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="h-1 w-6 rounded bg-[#5ec8ff]" />
                  {t("legWater")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-3 w-6 rounded bg-[#4a3622]" />
                  {t("legPeat")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-3 w-6 rounded bg-gradient-to-r from-[#3a0d03] via-[#ff6a1f] to-[#ffd27a]" />
                  {t("legFire")}
                </li>
              </ul>
              <p className="mt-3 max-w-[16rem] text-xs text-stone-400">{t("c4Hint")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
