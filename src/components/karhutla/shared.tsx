import type { ReactNode } from "react";
import { PATHS, type Key } from "@/data/karhutla";

export type T = (k: Key) => string;

/** Kicker + title + lead paragraph shared by every chapter. */
export function Heading({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <header className="max-w-2xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-orange-300/80">{kicker}</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-stone-50 sm:text-5xl">{title}</h2>
      {children && <p className="mt-5 text-base leading-relaxed text-stone-300/90 sm:text-lg">{children}</p>}
    </header>
  );
}

/** The island silhouettes, drawn in map coordinates (see MAP in data/karhutla). */
export function LandMass({ fill = "#2a1d18", stroke = "#6b4a3a" }: { fill?: string; stroke?: string }) {
  return (
    <g fill={fill} stroke={stroke} strokeWidth={1} strokeLinejoin="round">
      {Object.entries(PATHS).map(([k, d]) => (
        <path key={k} d={d} opacity={k === "peninsula" ? 0.6 : 1} />
      ))}
    </g>
  );
}

export const fmt = (n: number, lang: string) => n.toLocaleString(lang === "id" ? "id-ID" : "en-US");
