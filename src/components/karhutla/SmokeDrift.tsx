"use client";

import { useReducedMotion } from "framer-motion";
import { useState } from "react";
import { ISPU, MAP, px } from "@/data/karhutla";
import styles from "./karhutla.module.css";
import { Heading, LandMass, type T } from "./shared";

// Smoke sources and the way the dry-season wind (from the south-east) carries it.
const ROUTES: { from: [number, number]; via: [number, number]; to: [number, number]; n: number }[] = [
  { from: [113.6, -2.4], via: [108.4, 0.6], to: [103.6, 3.2], n: 6 },
  { from: [104.2, -3.2], via: [102.6, 0], to: [101.3, 3.8], n: 5 },
  { from: [102.0, -0.6], via: [101.2, 1.8], to: [101.9, 4.4], n: 4 },
];

const path = (r: (typeof ROUTES)[number]) => {
  const [a, b, c] = [r.from, r.via, r.to].map(([lo, la]) => px(lo, la));
  return `M${a[0]},${a[1]} Q${b[0]},${b[1]} ${c[0]},${c[1]}`;
};

const WIND = [
  { lon: 117, lat: -8.2 },
  { lon: 108, lat: -10 },
  { lon: 125, lat: -6 },
] as const;

export default function SmokeDrift({ t }: { t: T }) {
  const [v, setV] = useState(160);
  const reduced = useReducedMotion();
  const band = ISPU.find((b) => v <= b.max) ?? ISPU[ISPU.length - 1];
  const [sgX, sgY] = px(103.8, 1.35);
  const [myX, myY] = px(101.7, 4.6);

  return (
    <section id="ch-4" className="mx-auto max-w-6xl px-6 py-28">
      <Heading kicker={t("c5Kicker")} title={t("c5Title")}>
        {t("c5Body")}
      </Heading>

      <div className="mt-12 grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#140d0b]">
          <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} className="block w-full" role="img" aria-label={t("c5Title")}>
            <defs>
              <filter id="kh-soft" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
              <radialGradient id="kh-haze" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#c9a37e" stopOpacity="0.9" />
                <stop offset="1" stopColor="#c9a37e" stopOpacity="0" />
              </radialGradient>
              <marker id="kh-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="#7fd1ff" />
              </marker>
            </defs>
            <rect width={MAP.w} height={MAP.h} fill="#0f0908" rx="8" />
            <LandMass />

            {/* haze that grows with the slider */}
            <ellipse cx={(sgX + myX) / 2} cy={(sgY + myY) / 2} rx="150" ry="110" fill="url(#kh-haze)" opacity={Math.min(1, v / 380)} style={{ transition: "opacity .3s" }} />
            <ellipse cx={px(104, -1)[0]} cy={px(104, -1)[1]} rx="130" ry="80" fill="url(#kh-haze)" opacity={Math.min(0.8, v / 450)} style={{ transition: "opacity .3s" }} />

            {/* wind */}
            {WIND.map((w, i) => {
              const [x, y] = px(w.lon, w.lat);
              return (
                <line
                  key={i}
                  className={reduced ? undefined : styles.dash}
                  x1={x}
                  y1={y}
                  x2={x - 62}
                  y2={y - 38}
                  stroke="#7fd1ff"
                  strokeOpacity="0.7"
                  strokeWidth="1.6"
                  markerEnd="url(#kh-arrow)"
                />
              );
            })}
            <text x={px(117, -8.2)[0] + 6} y={px(117, -8.2)[1] + 14} fill="#7fd1ff" fontSize="11" fontFamily="var(--font-geist-mono)">
              {t("wind")} →
            </text>

            {/* drifting smoke */}
            {!reduced &&
              ROUTES.flatMap((r, ri) =>
                Array.from({ length: r.n }, (_, i) => (
                  <circle key={`${ri}-${i}`} r="4" fill="#b09484" filter="url(#kh-soft)" opacity="0">
                    <animateMotion dur="10s" begin={`${-(i * 10) / r.n}s`} repeatCount="indefinite" path={path(r)} />
                    <animate attributeName="r" values="3;22" dur="10s" begin={`${-(i * 10) / r.n}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.55;0" dur="10s" begin={`${-(i * 10) / r.n}s`} repeatCount="indefinite" />
                  </circle>
                ))
              )}

            {/* sources */}
            {ROUTES.map((r, i) => {
              const [x, y] = px(...r.from);
              return <circle key={i} className={styles.pulse} cx={x} cy={y} r="4" fill="#ff4d1c" />;
            })}

            <circle cx={sgX} cy={sgY} r="3" fill="#fff" />
            <text x={sgX + 8} y={sgY + 4} fill="#f2e6dc" fontSize="11" fontFamily="var(--font-geist-mono)">
              Singapore
            </text>
            <text x={myX} y={myY - 20} fill="#d9c8bd" fillOpacity="0.7" fontSize="11" fontFamily="var(--font-geist-mono)" textAnchor="middle">
              {t("lblMY")}
            </text>
          </svg>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-lg font-medium text-white">{t("ispuTitle")}</h3>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-stone-400">{t("ispuIndex")}</p>
              <p className="font-mono text-5xl font-bold tabular-nums text-white">{v}</p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-sm font-medium"
              style={{ background: band.color, color: band.color === "#e9c43a" ? "#1b1b1f" : "#fff", border: band.color === "#1b1b1f" ? "1px solid #888" : undefined }}
            >
              {t(band.name)}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={400}
            value={v}
            onChange={(e) => setV(Number(e.target.value))}
            aria-label={t("ispuIndex")}
            className="mt-6 w-full accent-orange-400"
          />
          <div className="mt-1 flex h-1.5 overflow-hidden rounded-full">
            {ISPU.map((b, i) => (
              <span key={i} style={{ background: b.color, flex: (Math.min(b.max, 400) - (i ? ISPU[i - 1].max : 0)) || 1 }} />
            ))}
          </div>

          <p className="mt-5 leading-relaxed text-stone-200" aria-live="polite">
            {t(band.desc)}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-stone-500">{t("ispuNote")}</p>
        </div>
      </div>
    </section>
  );
}
