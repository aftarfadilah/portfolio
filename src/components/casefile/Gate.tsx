"use client";

import { useEffect, useState } from "react";
import { gate } from "@/data/casefile";
import { useReducedMotion } from "./useReducedMotion";

const DURATION = 2600;

/** Black "test runner" loader: a counter, a log that fills in, and a way out. */
export default function Gate({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(onDone, 0);
      return () => clearTimeout(t);
    }
    const start = performance.now();
    const tick = setInterval(() => {
      const p = Math.min(100, Math.round(((performance.now() - start) / DURATION) * 100));
      setPct(p);
      if (p >= 100) {
        clearInterval(tick);
        setTimeout(onDone, 350);
      }
    }, 40);
    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    return () => {
      clearInterval(tick);
      window.removeEventListener("keydown", skip);
    };
  }, [reduced, onDone]);

  const shown = Math.ceil((pct / 100) * gate.lines.length);

  return (
    <div role="status" aria-label={gate.title} className="fixed inset-0 z-[70] flex flex-col justify-between bg-black p-6 font-mono text-[#c8c8c8] sm:p-8">
      <div className="flex items-start justify-between text-sm">
        <span>{gate.title}</span>
        <span>{new Date().getFullYear()}</span>
      </div>

      <ul className="max-w-xl space-y-1 text-xs leading-relaxed sm:text-sm" aria-hidden>
        {gate.lines.slice(0, shown).map((l) => (
          <li key={l} className={l.includes("flaky") ? "text-ember" : l.startsWith("47 passed") ? "text-white" : "opacity-70"}>
            {l}
          </li>
        ))}
      </ul>

      <div className="flex items-end justify-between">
        <button type="button" onClick={onDone} className="cursor-pointer text-xs opacity-50 hover:opacity-100">
          {gate.skip}
        </button>
        <span className="text-[22vw] leading-[0.8] font-light tracking-[-0.06em] text-white tabular-nums sm:text-[14vw]">{pct}</span>
      </div>
    </div>
  );
}
