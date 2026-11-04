"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { exhibit } from "@/data/casefile";
import styles from "./casefile.module.css";
import { useReducedMotion } from "./useReducedMotion";

/**
 * A dim screenshot in an instrument frame. A lens follows the pointer; inside it the
 * same screenshot is inverted and the design notes are drawn over it. Until the
 * visitor touches it, the lens drifts on its own.
 */
export default function Exhibit() {
  const box = useRef<HTMLDivElement>(null);
  const x = useRef<HTMLSpanElement>(null);
  const y = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const set = (fx: number, fy: number) => {
      el.style.setProperty("--x", `${fx}%`);
      el.style.setProperty("--y", `${fy}%`);
      const r = el.getBoundingClientRect();
      if (x.current) x.current.textContent = String(Math.round((fx / 100) * r.width)).padStart(4, "0");
      if (y.current) y.current.textContent = String(Math.round((fy / 100) * r.height)).padStart(4, "0");
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
    <Image src="/clinicos-dashboard.webp" alt="" width={1910} height={784} sizes="(min-width: 1024px) 1100px, 100vw" className={`block h-full w-full object-cover ${cls}`} draggable={false} />
  );

  return (
    <section id="exhibit" aria-label="Exhibit" className={`${styles.ui} bg-black px-[10px] py-16 text-white sm:pt-8 sm:pb-24`}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-[10px] flex justify-between">
          <span><span className="opacity-50">{"// "}</span>{exhibit.kicker}</span>
          <span>{exhibit.title}</span>
        </div>

        <div
          ref={box}
          role="img"
          aria-label={exhibit.alt}
          style={{ ["--r" as string]: "clamp(80px, 13vw, 190px)", touchAction: "pan-y" }}
          className={`${styles.hatchBox} relative aspect-[1910/784] w-full overflow-hidden bg-black select-none`}
        >
          <div className="absolute inset-0 opacity-45 grayscale">{img("")}</div>

          <div className={`${styles.lensReveal} absolute inset-0`}>
            <div className="absolute inset-0 bg-black">{img("invert hue-rotate-180 contrast-125")}</div>
            {exhibit.marks.map((m) => (
              <div key={m.label} className="absolute border border-red-600" style={{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%` }}>
                <span className="absolute -top-[14px] left-0 bg-red-600 px-1 whitespace-nowrap text-black">{m.label}</span>
              </div>
            ))}
          </div>

          {["left-0 top-0", "right-0 top-0", "left-0 bottom-0", "right-0 bottom-0"].map((c) => (
            <span key={c} className={`absolute h-[3px] w-[3px] bg-[#d9d9d9] ${c}`} />
          ))}
          <div aria-hidden className={`${styles.lensRing} pointer-events-none absolute rounded-full border border-red-600/70`} />
          <div aria-hidden className={`${styles.scanline} pointer-events-none absolute inset-x-0 h-px bg-red-600/60`} />
          <span className={`${styles.chip} absolute bottom-0 left-0`}>X <span ref={x}>0000</span></span>
          <span className={`${styles.chip} absolute right-0 bottom-0`}>Y <span ref={y}>0000</span></span>
        </div>

        <p className="mt-[10px] flex justify-between">
          <span className="opacity-50">
            <span className="hidden [@media(pointer:fine)]:inline">{exhibit.hint}</span>
            <span className="[@media(pointer:fine)]:hidden">{exhibit.hintTouch}</span>
          </span>
          <span className="opacity-50">{"//"}</span>
        </p>
      </div>
    </section>
  );
}
