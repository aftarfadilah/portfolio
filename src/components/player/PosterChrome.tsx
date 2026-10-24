"use client";

import { useEffect, useRef } from "react";
import { callouts } from "./mat";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const FEATURES = [
  { jp: "アナログ", en: "Analog" },
  { jp: "ノイズ", en: "Crackle" },
  { jp: "キュー", en: "Cue lever" },
  { jp: "YouTube", en: "Stream" },
];

/** Retro Japanese record-ad dressing laid over the 3D scene. Purely visual. */
const CALLOUT_LABELS = [
  { en: "Platter", jp: "プラッター", dx: -150, dy: -90 },
  { en: "Tonearm", jp: "トーンアーム", dx: 120, dy: 25 },
  { en: "Start / Stop", jp: "スタート", dx: -120, dy: 80 },
];

export default function PosterChrome() {
  const lines = useRef<(SVGGElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      callouts.forEach((c, i) => {
        const el = lines.current[i];
        if (!el) return;
        const l = CALLOUT_LABELS[i];
        el.style.opacity = c.on ? "1" : "0";
        el.setAttribute("transform", `translate(${c.x} ${c.y})`);
        el.firstElementChild?.setAttribute("x2", String(l.dx));
        el.firstElementChild?.setAttribute("y2", String(l.dy));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* colour wash: pink top-left, blue bottom-right, dark edges */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background:
            "radial-gradient(60% 50% at 8% 8%, rgba(245,155,180,.16), transparent 70%), radial-gradient(55% 50% at 95% 95%, rgba(63,127,181,.2), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,.55) 100%)",
        }}
      />
      {/* halftone dots */}
      <div
        className="absolute bottom-0 right-0 h-1/2 w-1/3 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(rgba(245,155,180,.55) 1px, transparent 1.4px)",
          backgroundSize: "9px 9px",
          maskImage: "linear-gradient(135deg, transparent 30%, black)",
          WebkitMaskImage: "linear-gradient(135deg, transparent 30%, black)",
        }}
      />
      {/* film grain */}
      <div
        className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />

      {/* limited edition sticker */}
      <div className="absolute right-2 top-2 flex h-16 w-16 sm:right-8 sm:top-28 sm:h-24 sm:w-24 -rotate-[8deg] flex-col items-center justify-center rounded-full bg-poster-pink text-center text-black shadow-[0_6px_24px_rgba(0,0,0,.45)]">
        <span className="text-[9px] font-bold uppercase leading-none tracking-[0.18em] sm:text-[10px]">
          Limited
        </span>
        <span className="font-serif text-lg font-bold italic leading-tight sm:text-xl">
          Edition
        </span>
        <span
          lang="ja"
          className="font-serif text-[9px] leading-none tracking-[0.3em]"
        >
          限定盤
        </span>
      </div>

      {/* vertical tagline + feature icons (wide screens) */}
      <div className="absolute left-6 top-[17%] hidden items-start gap-5 lg:flex">
        <p
          lang="ja"
          className="font-serif text-2xl font-normal tracking-[0.2em] text-white/90"
          style={{ writingMode: "vertical-rl" }}
        >
          針をおろして。
        </p>
        <ul className="mt-2 space-y-3">
          {FEATURES.map((f) => (
            <li key={f.en} className="flex flex-col items-center gap-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/40 font-serif text-[9px] text-white/80">
                {f.jp.slice(0, 2)}
              </span>
              <span className="font-mono text-[8px] uppercase tracking-wider text-poster-silver/60">
                {f.en}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* callouts pointing at the turntable's parts (wide screens) */}
      <svg className="absolute inset-0 hidden h-full w-full lg:block">
        {CALLOUT_LABELS.map((l, i) => (
          <g
            key={l.en}
            ref={(el) => {
              lines.current[i] = el;
            }}
            style={{ opacity: 0, transition: "opacity .4s" }}
          >
            <line
              x1={0}
              y1={0}
              stroke="rgba(245,155,180,.85)"
              strokeWidth={1}
            />
            <circle r={3.5} fill="#f59bb4" />
            <text
              x={l.dx + (l.dx < 0 ? -8 : 8)}
              y={l.dy}
              textAnchor={l.dx < 0 ? "end" : "start"}
              fill="#fff"
              fontSize={12}
              fontFamily="ui-monospace, monospace"
              letterSpacing="0.18em"
              style={{ textTransform: "uppercase" }}
            >
              {l.en}
            </text>
            <text
              x={l.dx + (l.dx < 0 ? -8 : 8)}
              y={l.dy + 16}
              textAnchor={l.dx < 0 ? "end" : "start"}
              fill="rgba(245,155,180,.9)"
              fontSize={11}
              letterSpacing="0.2em"
              fontFamily="'Hiragino Mincho ProN','Yu Mincho',serif"
            >
              {l.jp}
            </text>
          </g>
        ))}
      </svg>

      {/* bottom info band */}
      <div className="absolute inset-x-0 bottom-0 hidden h-44 bg-gradient-to-t from-black via-black/70 to-transparent lg:block" />
    </div>
  );
}
