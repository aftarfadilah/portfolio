"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { createContext, useContext, useRef, type ReactNode, type RefObject } from "react";
import { PATHS, type Key } from "@/data/karhutla";
import styles from "./karhutla.module.css";

export type T = (k: Key) => string;
export type Tone = "paper" | "dark";

/** The scroll container of the story, for components that react to scroll position. */
export const ScrollerCtx = createContext<RefObject<HTMLDivElement | null> | null>(null);
export const useScroller = () => useContext(ScrollerCtx);

export const serif = styles.serif;

/** Chapter opener: a large numeral in the margin, the title in serif, a short lead. */
export function ChapterHead({ n, kicker, title, children }: { n: number; kicker: string; title: string; children?: ReactNode }) {
  return (
    <header className="grid gap-x-10 gap-y-3 md:grid-cols-[7rem_1fr]">
      <p aria-hidden="true" className={`${serif} text-6xl italic leading-none text-ember md:text-8xl`}>
        {String(n).padStart(2, "0")}
      </p>
      <div className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-60">{kicker}</p>
        <h2 className={`${serif} mt-3 text-4xl leading-[1.02] sm:text-6xl lg:text-7xl`}>{title}</h2>
        {children && <p className="mt-6 max-w-xl text-base leading-relaxed opacity-75 sm:text-lg">{children}</p>}
      </div>
    </header>
  );
}

function Word({ word, p, from, to }: { word: string; p: MotionValue<number>; from: number; to: number }) {
  const reduced = useReducedMotion();
  const opacity = useTransform(p, [from, to], reduced ? [1, 1] : [0.14, 1]);
  return (
    <motion.span aria-hidden="true" style={{ opacity }} className="mr-[0.26em] inline-block">
      {word}
    </motion.span>
  );
}

/** Words brighten one after another as the paragraph scrolls through the middle of the screen. */
export function ScrollText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const scroller = useScroller();
  const { scrollYProgress } = useScroll({ target: ref, container: scroller ?? undefined, offset: ["start 0.85", "end 0.5"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <Word key={i} word={w} p={scrollYProgress} from={i / words.length} to={Math.min(1, (i + 1.6) / words.length)} />
      ))}
    </p>
  );
}

/** The island silhouettes, drawn in map coordinates (see MAP in data/karhutla). */
export function LandMass({ fill = "#f7f3ec", stroke = "#b7ab97" }: { fill?: string; stroke?: string }) {
  return (
    <g fill={fill} stroke={stroke} strokeWidth={1} strokeLinejoin="round">
      {Object.entries(PATHS).map(([k, d]) => (
        <path key={k} d={d} opacity={k === "peninsula" ? 0.7 : 1} />
      ))}
    </g>
  );
}

export const fmt = (n: number, lang: string) => n.toLocaleString(lang === "id" ? "id-ID" : "en-US");

/** Small caption under a figure. */
export function Caption({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-xs leading-relaxed opacity-60">{children}</p>;
}
