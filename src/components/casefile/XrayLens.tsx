"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { xray } from "@/data/casefile";
import styles from "./casefile.module.css";
import { useReducedMotion } from "./useReducedMotion";

/**
 * A dim screenshot with a lens that follows the pointer. Inside the lens the
 * same screenshot is inverted and the tester's questions are drawn over it.
 * Until the visitor touches it, the lens drifts on its own.
 */
export default function XrayLens() {
  const box = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const set = (x: number, y: number) => {
      el.style.setProperty("--x", `${x}%`);
      el.style.setProperty("--y", `${y}%`);
    };
    set(50, 50);
    if (reduced) return;

    let raf = 0;
    let driving = true;
    const t0 = performance.now();
    const drift = (now: number) => {
      if (!driving) return;
      const t = (now - t0) / 1000;
      set(50 + Math.sin(t * 0.7) * 32, 50 + Math.sin(t * 1.1 + 1) * 28);
      raf = requestAnimationFrame(drift);
    };
    raf = requestAnimationFrame(drift);

    const onMove = (e: PointerEvent) => {
      driving = false;
      cancelAnimationFrame(raf);
      const r = el.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
    };
    el.addEventListener("pointermove", onMove);
    return () => {
      driving = false;
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  const img = (cls: string) => (
    <Image src="/clinicos-dashboard.webp" alt="" width={1910} height={784} sizes="(min-width: 1024px) 1000px, 100vw" className={`block h-full w-full object-cover ${cls}`} draggable={false} />
  );

  return (
    <section aria-labelledby="xray-heading" className="mx-auto max-w-6xl px-6 py-24 sm:py-40">
      <p className="font-mono text-xs tracking-[0.18em] text-ember sm:text-sm">{xray.kicker}</p>
      <h2 id="xray-heading" className="mt-3 mb-10 text-4xl font-light tracking-[-0.04em] sm:text-6xl">
        {xray.title}
      </h2>

      <div
        ref={box}
        role="img"
        aria-label={xray.alt}
        style={{ ["--r" as string]: "clamp(80px, 13vw, 190px)", touchAction: "pan-y" }}
        className="relative aspect-[1910/784] w-full overflow-hidden border border-white/15 bg-black select-none"
      >
        <div className="absolute inset-0 opacity-45 grayscale">{img("")}</div>

        <div className={`${styles.lensReveal} absolute inset-0`}>
          <div className="absolute inset-0 bg-black">{img("invert hue-rotate-180 contrast-125")}</div>
          {xray.marks.map((m) => (
            <div key={m.label} className="absolute border border-ember" style={{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%` }}>
              <span className="absolute -top-5 left-0 bg-ember px-1 font-mono text-[9px] whitespace-nowrap text-black sm:text-[11px]">{m.label}</span>
            </div>
          ))}
        </div>

        <div aria-hidden className={`${styles.lensRing} pointer-events-none absolute rounded-full border border-ember/70`} />
        <div aria-hidden className={`${styles.scanline} pointer-events-none absolute inset-x-0 h-px bg-ember/60`} />
      </div>

      <p className="mt-4 font-mono text-xs opacity-50">
        <span className="hidden [@media(pointer:fine)]:inline">{xray.hint}</span>
        <span className="[@media(pointer:fine)]:hidden">{xray.hintTouch}</span>
      </p>
    </section>
  );
}
