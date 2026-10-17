"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Heading, type T } from "./shared";

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
  { Scene: Volunteer, title: "pe1T", body: "pe1B" },
  { Scene: Student, title: "pe2T", body: "pe2B" },
  { Scene: Farmer, title: "pe3T", body: "pe3B" },
] as const;

export default function People({ t }: { t: T }) {
  return (
    <section id="ch-5" className="mx-auto max-w-6xl px-6 py-28">
      <Heading kicker={t("c6Kicker")} title={t("c6Title")} />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {SCENES.map(({ Scene, title, body }, i) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: i * 0.12 }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            <Scene />
            <div className="p-5">
              <h3 className="text-lg font-medium text-white">{t(title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">{t(body)}</p>
            </div>
          </motion.article>
        ))}
      </div>
      <p className="mt-6 text-xs italic text-stone-500">{t("c6Note")}</p>
    </section>
  );
}
