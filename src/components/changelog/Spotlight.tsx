"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { screenshot } from "@/data/changelog";
import styles from "./changelog.module.css";
import { useReducedMotion } from "./useReducedMotion";

/**
 * A dim screenshot with a spotlight that follows the pointer. Inside the circle the
 * screen is lit up and the design notes appear. Until the visitor touches it, the
 * spotlight drifts on its own.
 */
export default function Spotlight() {
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
    <Image src="/clinicos-dashboard.webp" alt="" width={1910} height={784} sizes="(min-width: 1024px) 900px, 100vw" className={`block h-full w-full object-cover ${cls}`} draggable={false} />
  );

  return (
    <figure className="my-2">
      <div
        ref={box}
        role="img"
        aria-label={screenshot.alt}
        style={{ ["--r" as string]: "clamp(80px, 13vw, 170px)", touchAction: "pan-y" }}
        className="relative aspect-[1910/784] w-full overflow-hidden rounded border border-white/10 bg-black select-none"
      >
        <div className="absolute inset-0 opacity-30 grayscale">{img("")}</div>
        <div className={`${styles.spot} absolute inset-0`}>
          <div className="absolute inset-0 bg-black">{img("brightness-110")}</div>
          {screenshot.marks.map((m) => (
            <div key={m.label} className="absolute rounded-sm border border-ember" style={{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%` }}>
              <span className="absolute -top-5 left-0 rounded-sm bg-ember px-1.5 font-mono text-[10px] whitespace-nowrap text-black">{m.label}</span>
            </div>
          ))}
        </div>
        <div aria-hidden className={`${styles.spotRing} pointer-events-none absolute rounded-full border border-ember/60`} />
      </div>
      <figcaption className="mt-2 font-mono text-[11px] text-syntax-comment">
        <span className="hidden [@media(pointer:fine)]:inline">{screenshot.hint}</span>
        <span className="[@media(pointer:fine)]:hidden">{screenshot.hintTouch}</span>
      </figcaption>
    </figure>
  );
}
