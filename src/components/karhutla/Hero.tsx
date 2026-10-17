"use client";

import { animate, useMotionValue, useTransform, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FIGURES, LABELS, SOURCES } from "@/data/karhutla";
import Haze from "./Haze";
import HotspotField, { type Stats } from "./HotspotField";
import { fmt, serif, type T } from "./shared";

/** Above the fold, and the whole page: the message in type, the evidence as a map of real detections. */
export default function Hero({ t, lang }: { t: T; lang: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const count = useMotionValue(0);
  const shown = useTransform(count, (v) => fmt(Math.round(v), lang));
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!started) return;
    const controls = animate(count, FIGURES.peakDay, { duration: 2.6, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [started, count]);

  const legend = [
    { label: t("conf_h"), n: stats?.high, color: "#ff5a1f" },
    { label: t("conf_n"), n: stats?.medium, color: "#ff9a3c" },
    { label: t("conf_l"), n: stats?.low, color: "#8f979f" },
  ];

  return (
    <section ref={ref} className="relative h-full min-h-[640px] w-full overflow-hidden bg-[#0a0706] text-[#efe7dc]">
      <HotspotField t={t} onStats={setStats} active={started} />

      {/* soft scrims keep the type readable where it crosses the map */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_18%_14%,rgba(10,7,6,0.85),transparent),radial-gradient(ellipse_60%_45%_at_14%_92%,rgba(10,7,6,0.8),transparent)]" />

      <div className={`pointer-events-none relative z-10 flex h-full flex-col justify-between px-6 pb-7 pt-20 transition-opacity duration-1000 sm:px-10 sm:pb-9 sm:pt-24 ${started ? "opacity-100" : "opacity-0"}`}>
        <div className={`transition-all duration-1000 ${started ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] opacity-70">{t("heroKicker")}</p>
          <h1 className={`${serif} mt-4 max-w-4xl text-[clamp(2.6rem,7.2vw,6.8rem)] leading-[0.96] lg:max-w-[calc(100%-21rem)]`}>{t("heroTitle")}</h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed opacity-80 sm:text-base">{t("heroDeck")}</p>
        </div>

        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <motion.p className={`${serif} text-[clamp(4.2rem,14vw,12.5rem)] leading-[0.82] tabular-nums`}>{shown}</motion.p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-white/20 pt-3">
              <p className="text-base sm:text-lg">{t("heroUnit")}</p>
              <p className="text-xs opacity-60">{t("heroPeak")}</p>
            </div>
          </div>

          <div className="max-w-sm text-xs lg:absolute lg:right-10 lg:top-24 lg:w-72">
            <p className="flex items-baseline justify-between font-medium uppercase tracking-[0.18em]">
              {t("hudTitle")}
              <span className="tabular-nums">{stats ? fmt(stats.n, lang) : "–"}</span>
            </p>
            <ul className="mt-3 grid gap-1.5">
              {legend.map((l) => (
                <li key={l.label} className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color, boxShadow: `0 0 10px ${l.color}` }} />
                  <span className="flex-1 opacity-85">{l.label}</span>
                  <span className="tabular-nums opacity-70">{l.n === undefined ? "–" : fmt(l.n, lang)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 leading-relaxed opacity-60">{t("hudPixel")}</p>
            <p className="mt-1 opacity-45">{t("hudMeta")}</p>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 opacity-70">
              {SOURCES.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="pointer-events-auto underline underline-offset-4 hover:opacity-100">
                  {s.label}
                </a>
              ))}
            </p>
            <p className="mt-3 hidden opacity-45 lg:block">{t("hint")}</p>
          </div>
        </div>
      </div>

      <Haze t={t} onStart={() => setStarted(true)} onCleared={() => setStarted(true)} />

      <p className="sr-only">
        {LABELS.map((l) => t(l.key)).join(", ")}
      </p>
    </section>
  );
}
