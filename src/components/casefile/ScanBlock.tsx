"use client";

import { useEffect, useRef } from "react";
import { ledger, panel } from "@/data/casefile";
import Figure from "./Figure";
import { LedgerTable } from "./Ledger";
import Marquee from "./Marquee";
import styles from "./casefile.module.css";

const pad = (n: number) => String(Math.max(0, Math.round(n))).padStart(3, "0");

/** The little map: drifting hatch, the figure in white, a red dot that mirrors the cursor, and X / Y chips. */
function MapBox() {
  const box = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const x = useRef<HTMLSpanElement>(null);
  const y = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (x.current) x.current.textContent = pad(e.clientX);
      if (y.current) y.current.textContent = pad(e.clientY);
      const r = box.current?.getBoundingClientRect();
      if (r && dot.current) {
        const fx = Math.min(1, Math.max(0, e.clientX / window.innerWidth));
        const fy = Math.min(1, Math.max(0, e.clientY / window.innerHeight));
        dot.current.style.transform = `translate(${fx * (r.width - 3)}px, ${fy * (r.height - 3)}px)`;
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div ref={box} className={`${styles.hatchBox} relative h-[142px] w-full overflow-hidden`}>
      {["left-0 top-0", "right-0 top-0", "left-0 bottom-0", "right-0 bottom-0"].map((c) => (
        <span key={c} className={`absolute h-[3px] w-[3px] bg-[#d9d9d9] ${c}`} />
      ))}
      <Figure mode="mask" className="absolute top-1/2 left-1/2 h-[50px] -translate-x-1/2 -translate-y-1/2" />
      <span ref={dot} className="absolute top-0 left-0 h-[3px] w-[3px] bg-red-600" />
      <span className={`${styles.chip} absolute bottom-0 left-0`}>
        X <span ref={x} className="min-w-[18px] text-right">000</span>
      </span>
      <span className={`${styles.chip} absolute right-0 bottom-0`}>
        Y <span ref={y} className="min-w-[18px] text-right">000</span>
      </span>
    </div>
  );
}

function Marks({ className = "" }: { className?: string }) {
  return (
    <>
      {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((c) => (
        <span key={c} aria-hidden className={`absolute h-2 w-2 border-white/60 ${c} ${className}`} />
      ))}
    </>
  );
}

function LeftRail() {
  return (
    <div className="flex flex-col justify-between gap-10 p-[10px] max-lg:contents lg:absolute lg:top-[10px] lg:bottom-[10px] lg:left-[10px] lg:w-[283px] lg:p-0">
      <div className="max-lg:order-1 max-lg:mx-auto max-lg:w-full max-lg:max-w-md max-lg:p-[10px]">
        <MapBox />
        <div className="mt-[10px] grid grid-cols-2 gap-y-[6px]">
          <span><span className="opacity-50">{"// "}</span>{panel.shift[0]}</span>
          <span className="text-right">{panel.watch[0]} <span className="opacity-50">{"//"}</span></span>
          <span className="pl-[14px]">{panel.shift[1]} <span className="opacity-50">{"//"}</span></span>
          <span className="text-right">{panel.watch[1]}</span>
        </div>
        <div className="mt-[70px] flex justify-between">
          <span className="opacity-50">{"//"}</span>
          <span>{panel.lat}</span>
        </div>
      </div>

      <div className="max-lg:order-3 max-lg:mx-auto max-lg:w-full max-lg:max-w-md max-lg:p-[10px]">
        <div className="relative h-[196px] p-[22px]">
          <Marks />
          <div className="flex gap-1" aria-hidden>
            <i className="h-[3px] w-[3px] bg-white" />
            <i className="h-[3px] w-[3px] bg-white" />
            <i className="h-[3px] w-[3px] bg-white" />
          </div>
          <div className="mt-8 grid grid-cols-[1fr_auto] gap-y-[6px]">
            {panel.rows.map(([k, v]) => (
              <span key={k} className="contents">
                <span>{k}</span>
                <span className="text-right">{v}</span>
              </span>
            ))}
          </div>
          <p className="mt-6">
            {panel.year} <span className="opacity-50">{"//"}</span> {panel.state}
          </p>
        </div>

        <div className="mt-[10px]">
          <div className="flex justify-between"><span>000</span><span>100</span></div>
          <div className="mt-[6px] h-[10px] border border-white/25">
            <div className={styles.scrub} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RightRail() {
  return (
    <div className="flex flex-col p-[10px] max-lg:hidden lg:absolute lg:top-[10px] lg:right-[10px] lg:bottom-[10px] lg:w-[283px] lg:p-0">
      <Marquee className="max-lg:hidden" />
      <div className={`${styles.fadeY} mt-[30px] max-h-[230px] overflow-hidden`}>
        <LedgerTable groups={ledger.slice(0, 3)} />
      </div>
      <div className="mt-8 flex justify-between lg:mt-[44px]">
        <span>{panel.lon}</span>
        <span className="opacity-50">{"//"}</span>
      </div>
      <span className="mt-auto self-end max-lg:hidden">scroll</span>
    </div>
  );
}

export default function ScanBlock() {
  return (
    <section id="scan" aria-label="Scan" className={`${styles.ui} relative overflow-hidden bg-black text-white max-lg:flex max-lg:flex-col max-lg:pb-16 lg:h-[100svh] lg:min-h-[680px]`}>
      <div aria-hidden className={styles.terrain} />
      <div aria-hidden className="pointer-events-none flex justify-center max-lg:order-2 max-lg:py-6 lg:absolute lg:inset-0 lg:items-center">
        <Figure mode="noise" className="h-[56svh] w-auto lg:h-[min(76svh,700px)]" />
      </div>
      <div className="max-lg:contents">
        <LeftRail />
        <RightRail />
      </div>
    </section>
  );
}
