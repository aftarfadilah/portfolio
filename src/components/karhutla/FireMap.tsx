"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { CONF_COLOR, DOTS, DOT_WEIGHT, FIGURES, MAP, PROVINCES, px, type Conf } from "@/data/karhutla";
import styles from "./karhutla.module.css";
import { Heading, LandMass, fmt, type T } from "./shared";

const CONFS: { id: Conf; key: "conf_h" | "conf_n" | "conf_l"; n: number }[] = [
  { id: "h", key: "conf_h", n: FIGURES.confidence.high },
  { id: "n", key: "conf_n", n: FIGURES.confidence.medium },
  { id: "l", key: "conf_l", n: FIGURES.confidence.low },
];

const LABELS = [
  { key: "lblSum", lon: 100.2, lat: -0.8 },
  { key: "lblKal", lon: 113.2, lat: 0.2 },
  { key: "lblJav", lon: 110.2, lat: -9.5 },
  { key: "lblSul", lon: 121.2, lat: 2.3 },
  { key: "lblPap", lon: 135.5, lat: -10 },
] as const;

export default function FireMap({ t, lang }: { t: T; lang: string }) {
  const [on, setOn] = useState<Record<Conf, boolean>>({ h: true, n: true, l: true });
  const shown = CONFS.filter((c) => on[c.id]).reduce((a, c) => a + c.n, 0);
  const max = Math.max(...PROVINCES.map((p) => p.value));

  return (
    <section id="ch-2" className="mx-auto max-w-6xl px-6 py-28">
      <Heading kicker={t("c3Kicker")} title={t("c3Title")}>
        {t("c3Body")}
      </Heading>

      <div className="mt-12 rounded-2xl border border-white/10 bg-[#140d0b] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("c3Filter")}>
            <span className="mr-1 font-mono text-[11px] uppercase tracking-widest text-stone-400">{t("c3Filter")}</span>
            {CONFS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={on[c.id]}
                onClick={() => setOn((s) => ({ ...s, [c.id]: !s[c.id] }))}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                  on[c.id] ? "border-white/30 bg-white/10 text-white" : "border-white/10 text-stone-500"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: CONF_COLOR[c.id], opacity: on[c.id] ? 1 : 0.35 }} />
                {t(c.key)}
              </button>
            ))}
          </div>
          <p className="font-mono text-sm text-stone-300">
            <span className="text-2xl font-bold tabular-nums text-white">{fmt(shown, lang)}</span> {t("c3Shown")}
          </p>
        </div>

        <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} className="mt-4 block w-full" role="img" aria-label={t("c3Title")}>
          <rect width={MAP.w} height={MAP.h} fill="#0f0908" rx="8" />
          <LandMass />
          {DOTS.map((d, i) => (
            <motion.circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={d.c === "h" ? 3.2 : 2.4}
              fill={CONF_COLOR[d.c]}
              className={d.c === "h" ? styles.pulse : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: on[d.c] ? 0.9 : 0.05 }}
              transition={{ delay: d.c === "n" ? d.d * 0.4 : 0, duration: 0.5 }}
            />
          ))}
          {LABELS.map((l) => {
            const [x, y] = px(l.lon, l.lat);
            return (
              <text key={l.key} x={x} y={y} textAnchor="middle" fill="#d9c8bd" fillOpacity="0.7" fontSize="12" fontFamily="var(--font-geist-mono)">
                {t(l.key)}
              </text>
            );
          })}
        </svg>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          {t("c3MapNote")} (×{DOT_WEIGHT})
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-orange-400/30 bg-orange-500/[0.06] p-6">
        <h3 className="text-lg font-medium text-white">{t("c3AreaT")}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-300">{t("c3AreaB")}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-stone-400">{t("c3Bars")}</h3>
        <ul className="mt-5 space-y-3">
          {PROVINCES.map((p, i) => (
            <li key={p.name.en} className="grid grid-cols-[8.5rem_1fr_3rem] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr_3.5rem]">
              <span className="text-stone-200">{p.name[lang === "id" ? "id" : "en"]}</span>
              <div className="h-3 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(p.value / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="text-right font-mono tabular-nums text-stone-300">{p.value === 0 ? t("c3Zero") : fmt(p.value, lang)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
