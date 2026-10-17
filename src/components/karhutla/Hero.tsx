"use client";

import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { FIGURES } from "@/data/karhutla";
import styles from "./karhutla.module.css";
import { fmt, serif, type T } from "./shared";

// A hazy dawn, kept deliberately dark and quiet so the typography carries the page.

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

const FAR = treeline(11, 760, 60);
const MID = treeline(29, 810, 80, 42);
const NEAR = treeline(53, 870, 100, 54);

const EMBERS = Array.from({ length: 22 }, (_, i) => ({
  x: 60 + ((i * 197) % 1480),
  y: 800 + ((i * 53) % 90),
  r: 1.2 + ((i * 7) % 4) * 0.5,
  dur: 8 + ((i * 3) % 9),
  delay: -((i * 1.7) % 12),
  dx: ((i % 5) - 2) * 26,
}));

export default function Hero({ t, lang }: { t: T; lang: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.3 });
  const count = useMotionValue(0);
  const shown = useTransform(count, (v) => fmt(Math.round(v), lang));

  useEffect(() => {
    if (!seen) return;
    const controls = animate(count, FIGURES.peakDay, { duration: 2.4, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [seen, count]);

  return (
    <section data-ch="0" id="ch-0" className="relative h-screen min-h-[680px] overflow-hidden bg-ink text-[#f1ece3]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="kh-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#16110e" />
            <stop offset="0.5" stopColor="#3a1a10" />
            <stop offset="0.85" stopColor="#a8481c" />
            <stop offset="1" stopColor="#d9712c" />
          </linearGradient>
          <radialGradient id="kh-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.9" />
            <stop offset="0.4" stopColor="#f08a3c" stopOpacity="0.5" />
            <stop offset="1" stopColor="#e2410d" stopOpacity="0" />
          </radialGradient>
          <filter id="kh-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="40" />
          </filter>
        </defs>
        <rect width="1600" height="900" fill="url(#kh-sky)" />
        <g className={styles.sunPulse}>
          <circle cx="1180" cy="640" r="360" fill="url(#kh-sun)" />
        </g>
        <g filter="url(#kh-blur)">
          <ellipse className={styles.smokeA} cx="420" cy="330" rx="540" ry="90" fill="#120c0a" opacity="0.7" />
          <ellipse className={styles.smokeB} cx="1180" cy="240" rx="640" ry="110" fill="#120c0a" opacity="0.7" />
          <ellipse className={styles.smokeC} cx="800" cy="520" rx="700" ry="60" fill="#3a1a10" opacity="0.5" />
        </g>
        <path d={FAR} fill="#4a2012" opacity="0.9" />
        <path d={MID} fill="#2a130c" />
        <path d={NEAR} fill="#16110e" />
        {EMBERS.map((e, i) => (
          <circle
            key={i}
            className={styles.ember}
            cx={e.x}
            cy={e.y}
            r={e.r}
            fill="#f6a24a"
            style={{ animationDuration: `${e.dur}s`, animationDelay: `${e.delay}s`, ["--dx" as string]: `${e.dx}px` }}
          />
        ))}
      </svg>

      <div ref={ref} className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-between px-6 pb-12 pt-24 sm:px-10">
        <div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ duration: 1 }} className="text-xs font-medium uppercase tracking-[0.2em]">
            {t("heroKicker")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`${serif} mt-5 max-w-4xl text-5xl leading-[0.98] sm:text-7xl lg:text-8xl`}
          >
            {t("heroTitle")}
          </motion.h1>
        </div>

        <div>
          <p className="max-w-md text-sm leading-relaxed opacity-80 sm:text-base">{t("heroLead")}</p>
          <div className="mt-2 flex flex-wrap items-end gap-x-6">
            <motion.span className={`${serif} text-[clamp(4.5rem,17vw,15rem)] leading-[0.85] tabular-nums`}>{shown}</motion.span>
            <span className="pb-3 text-base opacity-90 sm:pb-6 sm:text-xl">{t("heroUnit")}</span>
          </div>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/20 pt-4">
            <p className="max-w-lg text-sm leading-relaxed opacity-75">{t("heroTail")}</p>
            <p className="text-xs opacity-60">{t("heroSource")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
