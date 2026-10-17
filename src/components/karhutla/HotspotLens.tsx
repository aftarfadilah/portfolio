"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { CONF_COLOR, GRID, GRID_H, GRID_W, type Key } from "@/data/karhutla";
import styles from "./karhutla.module.css";
import { Heading, type T } from "./shared";

const CELL_W = 50;
const CELL_H = 44;
const X0 = 50;
const Y0 = 118;
const SPAN = (GRID_W - 1) * CELL_W;

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/** Cool brown for ground, white-hot orange for fire. */
function heat(k: number): string {
  const t = Math.min(1, Math.max(0, (k - 296) / 70));
  const rgb = t < 0.35 ? mix([48, 34, 28], [96, 54, 34], t / 0.35) : mix([96, 54, 34], [255, 120, 40], (t - 0.35) / 0.65);
  return `rgb(${rgb.join(",")})`;
}

export default function HotspotLens({ t }: { t: T }) {
  const [sel, setSel] = useState<number | null>(null);
  const px = sel === null ? null : GRID[sel];
  const kind = px?.c ?? "c";
  const key = (suffix: "" | "_d"): Key => `conf_${kind}${suffix}` as Key;

  return (
    <section id="ch-1" className="mx-auto max-w-6xl px-6 py-28">
      <Heading kicker={t("c2Kicker")} title={t("c2Title")}>
        {t("c2Body")}
      </Heading>

      <div className="mt-12 grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="overflow-hidden rounded-2xl border border-white/10 bg-[#140d0b]"
        >
          <svg viewBox="0 0 700 440" className="block w-full" role="img" aria-label={t("c2Title")}>
            <defs>
              <linearGradient id="kh-beam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#7fd1ff" stopOpacity="0.55" />
                <stop offset="1" stopColor="#7fd1ff" stopOpacity="0.05" />
              </linearGradient>
              <radialGradient id="kh-star" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* orbit line */}
            <path d="M0,62 Q350,12 700,62" fill="none" stroke="#7fd1ff" strokeOpacity="0.25" strokeDasharray="4 6" />

            {/* ground pixels */}
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
                    rx={3}
                    fill={heat(p.k)}
                    stroke={on ? "#fff" : hot ? CONF_COLOR[p.c as "h" | "n" | "l"] : "transparent"}
                    strokeOpacity={on ? 1 : 0.55}
                    strokeWidth={on ? 2.5 : 1}
                    className="cursor-pointer outline-none transition-opacity hover:opacity-80 focus-visible:stroke-white"
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
                  {hot && (
                    <circle
                      className={styles.pulse}
                      cx={gx + CELL_W / 2}
                      cy={gy + CELL_H / 2}
                      r={4}
                      fill="#fff"
                      opacity={0.85}
                      pointerEvents="none"
                    />
                  )}
                </g>
              );
            })}

            {/* satellite sweeping across, its beam lighting one column of pixels */}
            <g className={styles.scan} style={{ ["--span" as string]: `${SPAN}px` }} pointerEvents="none">
              <polygon points={`${X0 + CELL_W / 2 - 4},58 ${X0 + CELL_W / 2 + 4},58 ${X0 + CELL_W},${Y0} ${X0},${Y0}`} fill="url(#kh-beam)" />
              <rect x={X0} y={Y0} width={CELL_W} height={GRID_H * CELL_H} fill="#7fd1ff" opacity="0.12" />
              <g transform={`translate(${X0 + CELL_W / 2},44)`}>
                <circle r="26" fill="url(#kh-star)" />
                <rect x="-6" y="-6" width="12" height="12" rx="2" fill="#d6e4ee" />
                <rect x="-26" y="-3" width="16" height="6" fill="#4aa3df" />
                <rect x="10" y="-3" width="16" height="6" fill="#4aa3df" />
                <line x1="-10" y1="0" x2="-6" y2="0" stroke="#d6e4ee" />
                <line x1="6" y1="0" x2="10" y2="0" stroke="#d6e4ee" />
              </g>
            </g>

            <text x={X0} y={Y0 + GRID_H * CELL_H + 22} fill="#a99a90" fontSize="11" fontFamily="var(--font-geist-mono)">
              {t("c2Hint")}
            </text>
          </svg>
        </motion.div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-live="polite">
          {px === null ? (
            <p className="text-stone-400">{t("c2None")}</p>
          ) : (
            <motion.div key={sel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <p className="font-mono text-[11px] uppercase tracking-widest text-stone-400">{t("c2Temp")}</p>
              <p className="mt-1 font-mono text-5xl font-bold tabular-nums text-white">
                {px.k}
                <span className="ml-1 text-xl text-stone-400">K</span>
              </p>
              <p
                className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium text-black"
                style={{ background: px.c === "c" ? "#6b5a52" : CONF_COLOR[px.c] }}
              >
                {t(key(""))}
              </p>
              <p className="mt-4 leading-relaxed text-stone-300">{t(key("_d"))}</p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
