"use client";

import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { FIGURES } from "@/data/karhutla";
import styles from "./karhutla.module.css";
import { fmt, type T } from "./shared";

// A hazy dawn: sun, smoke bands, a treeline and rising embers, all SVG.

/** Rounded canopy silhouette along the bottom, from a fixed seed so SSR matches. */
function treeline(seed: number, base: number, amp: number, step = 34): string {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  let d = `M0,900 L0,${base}`;
  for (let x = 0; x < 1640; x += step) {
    const h = base - amp * (0.4 + r() * 0.6);
    d += ` Q${x + step / 2},${h - amp * 0.35} ${x + step},${base - amp * 0.2 * r()}`;
  }
  return d + " L1600,900 Z";
}

const FAR = treeline(11, 700, 70);
const MID = treeline(29, 760, 90, 42);
const NEAR = treeline(53, 830, 110, 54);

const EMBERS = Array.from({ length: 28 }, (_, i) => ({
  x: 60 + ((i * 197) % 1480),
  y: 780 + ((i * 53) % 90),
  r: 1.2 + ((i * 7) % 5) * 0.5,
  dur: 7 + ((i * 3) % 9),
  delay: -((i * 1.7) % 12),
  dx: ((i % 5) - 2) * 26,
}));

export default function Hero({ t, lang }: { t: T; lang: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.4 });
  const count = useMotionValue(0);
  const shown = useTransform(count, (v) => fmt(Math.round(v), lang));

  useEffect(() => {
    if (!seen) return;
    const controls = animate(count, FIGURES.peakDay, { duration: 2.6, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [seen, count]);

  return (
    <section id="ch-0" className="relative h-screen min-h-[640px] overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="kh-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b0f0d" />
            <stop offset="0.45" stopColor="#7a2d12" />
            <stop offset="0.8" stopColor="#e2742b" />
            <stop offset="1" stopColor="#f6a24a" />
          </linearGradient>
          <radialGradient id="kh-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff0c8" />
            <stop offset="0.35" stopColor="#ffb25a" />
            <stop offset="1" stopColor="#ff7a2a" stopOpacity="0" />
          </radialGradient>
          <filter id="kh-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="38" />
          </filter>
          <linearGradient id="kh-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.55" stopColor="#120b0a" stopOpacity="0" />
            <stop offset="1" stopColor="#120b0a" stopOpacity="1" />
          </linearGradient>
        </defs>

        <rect width="1600" height="900" fill="url(#kh-sky)" />

        <g className={styles.sunPulse}>
          <circle cx="1130" cy="560" r="330" fill="url(#kh-sun)" />
        </g>
        <circle cx="1130" cy="560" r="62" fill="#ffe3a8" opacity="0.92" />

        <g filter="url(#kh-blur)">
          <ellipse className={styles.smokeA} cx="420" cy="360" rx="520" ry="90" fill="#2b1a14" opacity="0.55" />
          <ellipse className={styles.smokeB} cx="1180" cy="250" rx="640" ry="110" fill="#1d120f" opacity="0.6" />
          <ellipse className={styles.smokeC} cx="800" cy="500" rx="700" ry="70" fill="#4a2616" opacity="0.5" />
        </g>

        <path d={FAR} fill="#5a2a18" opacity="0.85" />
        <path d={MID} fill="#341810" />
        <path d={NEAR} fill="#1a0e0b" />

        {EMBERS.map((e, i) => (
          <circle
            key={i}
            className={styles.ember}
            cx={e.x}
            cy={e.y}
            r={e.r}
            fill="#ffb25a"
            style={{ animationDuration: `${e.dur}s`, animationDelay: `${e.delay}s`, ["--dx" as string]: `${e.dx}px` }}
          />
        ))}
        <rect width="1600" height="900" fill="url(#kh-fade)" />
      </svg>

      <div ref={ref} className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-6 pt-16">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-orange-200/90"
        >
          {t("heroKicker")}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-7xl"
        >
          {t("heroTitle")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="mt-8 max-w-xl text-base text-orange-50/90 sm:text-lg"
        >
          {t("heroLead")}
        </motion.p>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <motion.span className="text-6xl font-bold tabular-nums tracking-tight text-white drop-shadow sm:text-8xl">
            {shown}
          </motion.span>
          <span className="text-lg text-orange-100">{t("heroUnit")}</span>
        </div>
        <p className="mt-2 font-mono text-[11px] text-orange-200/70">{t("heroSource")}</p>
        <p className="mt-8 max-w-xl text-sm leading-relaxed text-stone-300 sm:text-base">{t("heroTail")}</p>

        <div className={`${styles.cue} mt-10 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-orange-100/80`}>
          <svg width="14" height="20" viewBox="0 0 14 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="12" height="18" rx="6" />
            <circle cx="7" cy="6" r="1.5" fill="currentColor" />
          </svg>
          {t("scroll")}
        </div>
      </div>
    </section>
  );
}
