"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { ChapterHead, serif, useScroller, type T } from "./shared";

// Three small SVG scenes. They are composites, not portraits of real people.

const Frame = ({ sky, children }: { sky: [string, string]; children: ReactNode }) => (
  <svg viewBox="0 0 320 200" className="block w-full" aria-hidden="true">
    <defs>
      <linearGradient id={`kh-p-${sky[0]}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={sky[0]} />
        <stop offset="1" stopColor={sky[1]} />
      </linearGradient>
    </defs>
    <rect width="320" height="200" fill={`url(#kh-p-${sky[0]})`} />
    {children}
  </svg>
);

function Volunteer() {
  return (
    <Frame sky={["#3d2a3f", "#f0a05a"]}>
      <circle cx="238" cy="118" r="30" fill="#ffd9a0" opacity="0.9" />
      <path d="M0,150 Q60,128 120,146 T250,142 T320,148 V200 H0Z" fill="#2a1a14" />
      <path d="M0,172 H320 V200 H0Z" fill="#1a100c" />
      {/* canal */}
      <path d="M0,168 Q160,158 320,170 V178 Q160,168 0,176Z" fill="#3d86b3" opacity="0.8" />
      {/* smoke thread on the horizon */}
      <path d="M92,140 C88,118 100,104 94,84 C90,70 98,60 96,48" stroke="#6b5a58" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.55" />
      {/* volunteer */}
      <g transform="translate(168,92)">
        <circle cx="0" cy="0" r="9" fill="#d9a07a" />
        <path d="M-11,-3 Q0,-16 11,-3 Z" fill="#e8603a" />
        <rect x="-10" y="9" width="20" height="30" rx="7" fill="#e8603a" />
        <rect x="-10" y="21" width="20" height="4" fill="#ffd34d" />
        <rect x="-8" y="38" width="6" height="22" fill="#2a2a38" />
        <rect x="2" y="38" width="6" height="22" fill="#2a2a38" />
        <line x1="12" y1="14" x2="26" y2="60" stroke="#6b4a2f" strokeWidth="3" strokeLinecap="round" />
      </g>
    </Frame>
  );
}

function Student() {
  return (
    <Frame sky={["#5a3322", "#e08a45"]}>
      <rect x="40" y="26" width="240" height="150" rx="6" fill="#2a1b17" />
      <rect x="52" y="38" width="216" height="126" fill="#d9772f" />
      <rect x="52" y="38" width="216" height="126" fill="#6a3a2a" opacity="0.35" />
      <circle cx="226" cy="80" r="16" fill="#ffd9a0" opacity="0.65" />
      <line x1="160" y1="38" x2="160" y2="164" stroke="#2a1b17" strokeWidth="5" />
      <line x1="52" y1="100" x2="268" y2="100" stroke="#2a1b17" strokeWidth="5" />
      <rect x="40" y="170" width="240" height="8" fill="#1a100c" />
      {/* student, back to us, mask strap visible */}
      <g transform="translate(112,100)">
        <circle cx="0" cy="0" r="22" fill="#1d1620" />
        <circle cx="-22" cy="-2" r="3" fill="#e9e4dc" />
        <circle cx="22" cy="-2" r="3" fill="#e9e4dc" />
        <path d="M-22,-2 Q0,12 22,-2" stroke="#e9e4dc" strokeWidth="1.5" fill="none" />
        <rect x="-26" y="22" width="52" height="56" rx="14" fill="#c43b3b" />
      </g>
    </Frame>
  );
}

function Farmer() {
  return (
    <Frame sky={["#2b3347", "#d98a52"]}>
      <path d="M0,120 H320 V200 H0Z" fill="#4a2f20" />
      <path d="M0,150 H320 V160 H0Z" fill="#3d86b3" opacity="0.8" />
      {/* rows of young palms */}
      {[30, 80, 130, 190, 240, 285].map((x, i) => (
        <g key={x} transform={`translate(${x},${118 - (i % 2) * 6})`}>
          <line x1="0" y1="0" x2="0" y2="-14" stroke="#2a4a2a" strokeWidth="2" />
          <path d="M0,-14 q-12,-4 -16,6 M0,-14 q12,-4 16,6 M0,-14 q-8,-12 -10,-2 M0,-14 q8,-12 10,-2" stroke="#3f8a3a" strokeWidth="2" fill="none" />
        </g>
      ))}
      {/* distant fire line */}
      <path d="M0,118 Q30,108 60,118 T120,116" stroke="#ff7a2a" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      <g transform="translate(206,96)">
        <path d="M-14,-6 Q0,-22 14,-6 Z" fill="#d9c28a" />
        <ellipse cx="0" cy="-5" rx="16" ry="3" fill="#d9c28a" />
        <circle cx="0" cy="2" r="8" fill="#c68d68" />
        <rect x="-10" y="10" width="20" height="30" rx="7" fill="#355f6e" />
        <rect x="-8" y="38" width="6" height="22" fill="#2a2a38" />
        <rect x="2" y="38" width="6" height="22" fill="#2a2a38" />
        <line x1="12" y1="16" x2="22" y2="54" stroke="#6b4a2f" strokeWidth="3" strokeLinecap="round" />
      </g>
    </Frame>
  );
}

const SCENES = [
  { Scene: Volunteer, title: "pe1T", body: "pe1B", roman: "i." },
  { Scene: Student, title: "pe2T", body: "pe2B", roman: "ii." },
  { Scene: Farmer, title: "pe3T", body: "pe3B", roman: "iii." },
] as const;

/** Cards pin to the top and shrink as the next one slides over them. */
function StackCard({ i, n, p, t }: { i: number; n: number; p: MotionValue<number>; t: T }) {
  const { Scene, title, body, roman } = SCENES[i];
  const scale = useTransform(p, [i / n, 1], [1, 1 - (n - 1 - i) * 0.045]);
  return (
    <div className={`md:sticky ${i < n - 1 ? "md:mb-[28vh]" : ""}`} style={{ top: 96 + i * 26 }}>
      <motion.article style={{ scale }} className="grid origin-top overflow-hidden border border-ink/15 bg-paper-2 md:grid-cols-2">
        <div className="[&_svg]:h-full [&_svg]:w-full [&_svg]:object-cover">
          <Scene />
        </div>
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <p className={`${serif} text-5xl italic text-ember`}>{roman}</p>
          <h3 className={`${serif} mt-4 text-3xl leading-tight sm:text-5xl`}>{t(title)}</h3>
          <p className="mt-4 max-w-md text-sm leading-relaxed opacity-75 sm:text-base">{t(body)}</p>
        </div>
      </motion.article>
    </div>
  );
}

export default function People({ t }: { t: T }) {
  const wrap = useRef<HTMLDivElement>(null);
  const scroller = useScroller();
  const { scrollYProgress } = useScroll({ target: wrap, container: scroller ?? undefined, offset: ["start 0.6", "end end"] });

  return (
    <section data-ch="5" id="ch-5" className="border-t border-ink/15 bg-paper text-ink">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:px-10 lg:py-40">
        <ChapterHead n={5} kicker={t("c6Kicker")} title={t("c6Title")} />
        <div ref={wrap} className="mt-16 flex flex-col gap-6 md:gap-0">
          {SCENES.map((_, i) => (
            <StackCard key={i} i={i} n={SCENES.length} p={scrollYProgress} t={t} />
          ))}
        </div>
        <p className="mt-10 max-w-xl text-xs italic leading-relaxed opacity-60">{t("c6Note")}</p>
      </div>
    </section>
  );
}
