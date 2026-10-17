"use client";

import { useReducedMotion } from "framer-motion";
import { useState } from "react";
import { FIGURES, ISPU, MAP, px } from "@/data/karhutla";
import styles from "./karhutla.module.css";
import { Caption, ChapterHead, LandMass, fmt, serif, type T } from "./shared";

// Smoke sources and the way the dry-season wind (from the south-east) carries it.
const ROUTES: { from: [number, number]; via: [number, number]; to: [number, number]; n: number }[] = [
  { from: [113.6, -2.4], via: [108.4, 0.6], to: [103.6, 3.2], n: 6 },
  { from: [104.2, -3.2], via: [102.6, 0], to: [101.3, 3.8], n: 5 },
  { from: [102.0, -0.6], via: [101.2, 1.8], to: [101.9, 4.4], n: 4 },
];

const route = (r: (typeof ROUTES)[number]) => {
  const [a, b, c] = [r.from, r.via, r.to].map(([lo, la]) => px(lo, la));
  return `M${a[0]},${a[1]} Q${b[0]},${b[1]} ${c[0]},${c[1]}`;
};

const WIND = [
  { lon: 117, lat: -8.2 },
  { lon: 108, lat: -10 },
  { lon: 125, lat: -6 },
] as const;

export default function SmokeDrift({ t, lang }: { t: T; lang: string }) {
  const [v, setV] = useState(160);
  const reduced = useReducedMotion();
  const band = ISPU.find((b) => v <= b.max) ?? ISPU[ISPU.length - 1];
  const [sgX, sgY] = px(103.8, 1.35);
  const [myX, myY] = px(101.7, 4.6);
  const bandColor = band.color === "#1b1b1f" ? "#f1ece3" : band.color;

  return (
    <section data-ch="4" id="ch-4" className="bg-ink-2 text-[#f1ece3]">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:px-10 lg:py-40">
        <ChapterHead n={4} kicker={t("c5Kicker")} title={t("c5Title")}>
          {t("c5Body")}
        </ChapterHead>

        <div className="mt-16 grid items-start gap-12 lg:grid-cols-12">
          <figure className="lg:col-span-7">
            <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} className="block w-full" role="img" aria-label={t("c5Title")}>
              <defs>
                <filter id="kh-soft" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="5" />
                </filter>
                <radialGradient id="kh-haze" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#d6b48e" stopOpacity="0.85" />
                  <stop offset="1" stopColor="#d6b48e" stopOpacity="0" />
                </radialGradient>
                <marker id="kh-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill="#8fd3f5" />
                </marker>
              </defs>
              <LandMass fill="#2d2520" stroke="#5c4c40" />

              <ellipse cx={(sgX + myX) / 2} cy={(sgY + myY) / 2} rx="150" ry="110" fill="url(#kh-haze)" opacity={Math.min(1, v / 380)} style={{ transition: "opacity .3s" }} />
              <ellipse cx={px(104, -1)[0]} cy={px(104, -1)[1]} rx="130" ry="80" fill="url(#kh-haze)" opacity={Math.min(0.8, v / 450)} style={{ transition: "opacity .3s" }} />

              {WIND.map((w, i) => {
                const [x, y] = px(w.lon, w.lat);
                return <line key={i} className={reduced ? undefined : styles.dash} x1={x} y1={y} x2={x - 62} y2={y - 38} stroke="#8fd3f5" strokeOpacity="0.75" strokeWidth="1.4" markerEnd="url(#kh-arrow)" />;
              })}
              <text x={px(117, -8.2)[0] + 6} y={px(117, -8.2)[1] + 14} fill="#8fd3f5" fontSize="10" letterSpacing="1.5">
                {t("wind").toUpperCase()}
              </text>

              {!reduced &&
                ROUTES.flatMap((r, ri) =>
                  Array.from({ length: r.n }, (_, i) => (
                    <circle key={`${ri}-${i}`} r="4" fill="#c9ad98" filter="url(#kh-soft)" opacity="0">
                      <animateMotion dur="10s" begin={`${-(i * 10) / r.n}s`} repeatCount="indefinite" path={route(r)} />
                      <animate attributeName="r" values="3;22" dur="10s" begin={`${-(i * 10) / r.n}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0;0.55;0" dur="10s" begin={`${-(i * 10) / r.n}s`} repeatCount="indefinite" />
                    </circle>
                  ))
                )}

              {ROUTES.map((r, i) => {
                const [x, y] = px(...r.from);
                return <circle key={i} className={styles.pulse} cx={x} cy={y} r="4" fill="#e2410d" />;
              })}

              <circle cx={sgX} cy={sgY} r="3" fill="#f1ece3" />
              <text x={sgX + 8} y={sgY + 4} fill="#f1ece3" fontSize="11">
                Singapore
              </text>
              <text x={myX} y={myY - 20} fill="#f1ece3" fillOpacity="0.55" fontSize="10" letterSpacing="1.5" textAnchor="middle">
                {t("lblMY").toUpperCase()}
              </text>
            </svg>
            <figcaption>
              <Caption>{t("fig3")}</Caption>
            </figcaption>
          </figure>

          <div className="lg:col-span-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-60">{t("ispuTitle")}</p>
            <div className="mt-4 flex items-end justify-between gap-4 border-t border-white/20 pt-4">
              <p className={`${serif} text-[7rem] leading-[0.8] tabular-nums sm:text-[9rem]`}>{v}</p>
              <p className={`${serif} pb-1 text-right text-3xl italic leading-tight sm:text-4xl`} style={{ color: bandColor }}>
                {t(band.name)}
              </p>
            </div>

            <div className="mt-8">
              <input type="range" min={0} max={400} value={v} onChange={(e) => setV(Number(e.target.value))} aria-label={t("ispuIndex")} className={styles.range} />
              <div className="mt-3 flex h-1 overflow-hidden">
                {ISPU.map((b, i) => (
                  <span key={i} style={{ background: b.color === "#1b1b1f" ? "#6d6560" : b.color, flex: Math.min(b.max, 400) - (i ? ISPU[i - 1].max : 0) || 1 }} />
                ))}
              </div>
            </div>

            <p className="mt-6 text-sm leading-relaxed opacity-85 sm:text-base" aria-live="polite">
              {t(band.desc)}
            </p>
            <p className="mt-4 text-xs leading-relaxed opacity-50">{t("ispuNote")}</p>
          </div>
        </div>

        <dl className="mt-24 grid border-t border-white/20 md:grid-cols-2">
          {([[`~${fmt(FIGURES.deathsPerYear, lang)}`, "c5S1"], [`>${fmt(FIGURES.ariTreated, lang)}`, "c5S2"]] as const).map(([n, k], i) => (
            <div key={k} className={`py-8 md:py-10 ${i === 0 ? "md:border-r md:border-white/20 md:pr-10" : "md:pl-10"}`}>
              <dt className={`${serif} text-6xl leading-none tabular-nums sm:text-7xl`}>{n}</dt>
              <dd className="mt-4 max-w-md text-sm leading-relaxed opacity-75">{t(k)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
