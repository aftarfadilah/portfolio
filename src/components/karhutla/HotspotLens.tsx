"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { CONF_COLOR, GRID, GRID_H, GRID_W, type Key } from "@/data/karhutla";
import styles from "./karhutla.module.css";
import { Caption, ChapterHead, serif, type T } from "./shared";

const CELL_W = 50;
const CELL_H = 44;
const X0 = 50;
const Y0 = 118;
const SPAN = (GRID_W - 1) * CELL_W;

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/** Warm paper tones for ground, ember for fire. */
function heat(k: number): string {
  const t = Math.min(1, Math.max(0, (k - 296) / 70));
  const rgb = t < 0.35 ? mix([226, 217, 200], [214, 176, 128], t / 0.35) : mix([214, 176, 128], [226, 65, 13], (t - 0.35) / 0.65);
  return `rgb(${rgb.join(",")})`;
}

export default function HotspotLens({ t }: { t: T }) {
  const [sel, setSel] = useState<number | null>(null);
  const px = sel === null ? null : GRID[sel];
  const kind = px?.c ?? "c";
  const key = (suffix: "" | "_d"): Key => `conf_${kind}${suffix}` as Key;

  return (
    <section data-ch="1" id="ch-1" className="bg-paper text-ink">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-28 sm:px-10 lg:grid-cols-12 lg:gap-16 lg:py-40">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <ChapterHead n={1} kicker={t("c2Kicker")} title={t("c2Title")}>
              {t("c2Body")}
            </ChapterHead>

            <div className="mt-10 border-t border-ink/20 pt-6 md:ml-[9rem]" aria-live="polite">
              {px === null ? (
                <p className="text-sm opacity-60">{t("c2Hint")}</p>
              ) : (
                <motion.div key={sel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-60">{t("c2Temp")}</p>
                  <p className={`${serif} mt-1 text-6xl leading-none`}>
                    {px.k}
                    <span className="ml-2 text-2xl opacity-50">K</span>
                  </p>
                  <p className="mt-4 flex items-center gap-2 text-sm font-medium">
                    <span className="h-3 w-3" style={{ background: px.c === "c" ? "#b7ab97" : CONF_COLOR[px.c] }} />
                    {t(key(""))}
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed opacity-75">{t(key("_d"))}</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <figure className="lg:col-span-7">
          <div className="bg-paper-2 p-3 sm:p-6">
            <svg viewBox="0 0 700 440" className="block w-full" role="img" aria-label={t("c2Title")}>
              <defs>
                <linearGradient id="kh-beam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#16110e" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#16110e" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d="M0,62 Q350,12 700,62" fill="none" stroke="#16110e" strokeOpacity="0.25" strokeDasharray="3 6" />

              {GRID.map((p, i) => {
                const gx = X0 + (i % GRID_W) * CELL_W;
                const gy = Y0 + Math.floor(i / GRID_W) * CELL_H;
                const hot = p.c !== "c";
                const on = sel === i;
                return (
                  <g key={i}>
                    <rect
                      x={gx + 1}
                      y={gy + 1}
                      width={CELL_W - 2}
                      height={CELL_H - 2}
                      fill={heat(p.k)}
                      stroke={on ? "#16110e" : "transparent"}
                      strokeWidth={on ? 2.5 : 1}
                      className="cursor-pointer outline-none transition-opacity hover:opacity-75 focus-visible:stroke-[#16110e]"
                      role="button"
                      tabIndex={0}
                      aria-label={`${t("c2Temp")} ${p.k} K`}
                      aria-pressed={on}
                      onClick={() => setSel(i)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSel(i);
                        }
                      }}
                    />
                    {hot && <circle className={styles.pulse} cx={gx + CELL_W / 2} cy={gy + CELL_H / 2} r={3} fill="#16110e" opacity={0.8} pointerEvents="none" />}
                  </g>
                );
              })}

              <g className={styles.scan} style={{ ["--span" as string]: `${SPAN}px` }} pointerEvents="none">
                <polygon points={`${X0 + CELL_W / 2 - 3},58 ${X0 + CELL_W / 2 + 3},58 ${X0 + CELL_W},${Y0} ${X0},${Y0}`} fill="url(#kh-beam)" />
                <rect x={X0} y={Y0} width={CELL_W} height={GRID_H * CELL_H} fill="#16110e" opacity="0.07" />
                <g transform={`translate(${X0 + CELL_W / 2},44)`} fill="#16110e">
                  <rect x="-6" y="-6" width="12" height="12" />
                  <rect x="-26" y="-3" width="16" height="6" opacity="0.55" />
                  <rect x="10" y="-3" width="16" height="6" opacity="0.55" />
                </g>
              </g>
            </svg>
          </div>
          <figcaption>
            <Caption>{t("fig1")}</Caption>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
