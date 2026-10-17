"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { CONF_COLOR, DOTS, DOT_WEIGHT, FIGURES, MAP, PROVINCES, px, type Conf } from "@/data/karhutla";
import styles from "./karhutla.module.css";
import { Caption, ChapterHead, LandMass, fmt, serif, type T } from "./shared";

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
    <section data-ch="2" id="ch-2" className="border-t border-ink/15 bg-paper text-ink">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:px-10 lg:py-40">
        <ChapterHead n={2} kicker={t("c3Kicker")} title={t("c3Title")}>
          {t("c3Body")}
        </ChapterHead>

        <figure className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-ink/20 pb-4">
            <p className={`${serif} text-6xl leading-none tabular-nums sm:text-7xl`}>
              {fmt(shown, lang)}
              <span className="ml-3 font-sans text-sm opacity-60">{t("c3Shown")}</span>
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2" role="group" aria-label={t("c3Filter")}>
              {CONFS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on[c.id]}
                  onClick={() => setOn((s) => ({ ...s, [c.id]: !s[c.id] }))}
                  className={`flex items-center gap-2 border-b-2 pb-1 text-sm transition ${on[c.id] ? "border-ink" : "border-transparent opacity-45"}`}
                >
                  <span className="h-3 w-3 rounded-full" style={{ background: CONF_COLOR[c.id] }} />
                  {t(c.key)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 bg-paper-2 p-2 sm:p-4">
            <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} className="block w-full" role="img" aria-label={t("c3Title")}>
              <LandMass />
              {DOTS.map((d, i) => (
                <motion.circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={d.c === "h" ? 3.4 : 2.5}
                  fill={CONF_COLOR[d.c]}
                  className={d.c === "h" ? styles.pulse : undefined}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: on[d.c] ? 0.9 : 0.06 }}
                  transition={{ delay: d.c === "n" ? d.d * 0.4 : 0, duration: 0.5 }}
                />
              ))}
              {LABELS.map((l) => {
                const [x, y] = px(l.lon, l.lat);
                return (
                  <text key={l.key} x={x} y={y} textAnchor="middle" fill="#16110e" fillOpacity="0.55" fontSize="11" letterSpacing="1.5">
                    {t(l.key).toUpperCase()}
                  </text>
                );
              })}
            </svg>
          </div>
          <figcaption>
            <Caption>
              {t("fig2")} {t("c3MapNote")} (×{DOT_WEIGHT})
            </Caption>
          </figcaption>
        </figure>

        <div className="mt-20 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h3 className="text-xs font-medium uppercase tracking-[0.18em] opacity-60">{t("c3Bars")}</h3>
            <ul className="mt-6">
              {PROVINCES.map((p, i) => (
                <li key={p.name.en} className="grid grid-cols-[8.5rem_1fr_3.5rem] items-center gap-4 border-t border-ink/15 py-3 text-sm sm:grid-cols-[11rem_1fr_4rem]">
                  <span>{p.name[lang === "id" ? "id" : "en"]}</span>
                  <div className="h-[3px] bg-ink/10">
                    <motion.div
                      className="h-full bg-ember"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(p.value / max) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <span className={`${serif} text-right text-2xl tabular-nums`}>{p.value === 0 ? t("c3Zero") : fmt(p.value, lang)}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="border-l-2 border-ember pl-6 lg:col-span-5">
            <h3 className={`${serif} text-3xl leading-tight sm:text-4xl`}>{t("c3AreaT")}</h3>
            <p className="mt-4 text-sm leading-relaxed opacity-75 sm:text-base">{t("c3AreaB")}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
