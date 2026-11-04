"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { narrative } from "@/data/casefile";
import Figure from "./Figure";
import { FIG_H, FIG_W, edgesAt } from "./figure";
import styles from "./casefile.module.css";

const LINE_H = 18;
const GAP = 14;

/** A line that surfaces as it nears the middle of the screen. */
function Line({ text, style, className }: { text: string; style: CSSProperties; className: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <p ref={ref} data-in={seen} style={{ minHeight: LINE_H, lineHeight: `${LINE_H}px`, ...style }} className={`${styles.line} ${className}`}>
      {text}
    </p>
  );
}

/**
 * The story, set in two columns that part around the figure. Each line's
 * padding comes from the silhouette's edge at that height, in plain CSS
 * calc() from the centre, so it re-flows with the page width and needs no
 * measuring. Under 768px the figure moves above and the text is one column.
 */
export default function CaseText() {
  const all = [narrative.heading, ...narrative.lines].map((l) => l.toUpperCase());
  const half = Math.ceil(all.length / 2);
  const cols = [all.slice(0, half), all.slice(half)];

  const H = half * LINE_H;
  const figH = H * 0.74;
  const figTop = H * 0.12;
  const figW = (figH * FIG_W) / FIG_H;

  const style = (col: 0 | 1, i: number): CSSProperties => {
    const e = edgesAt((i * LINE_H + LINE_H / 2 - figTop) / figH);
    if (col === 0) {
      const off = e ? (e.l - 0.5) * figW : 0;
      return { ["--pr" as string]: `calc(50% + ${-off + GAP}px)` };
    }
    const off = e ? (e.r - 0.5) * figW : 0;
    return { ["--pl" as string]: `calc(50% + ${off + GAP}px)` };
  };

  return (
    <section id="case" aria-label="Case file" className={`${styles.ui} relative bg-black px-[10px] py-16 text-white md:px-0 md:py-20`}>
      <div
        className="relative mx-auto md:h-[var(--h)]"
        style={{ ["--h" as string]: `${H}px`, ["--fh" as string]: `${figH}px`, ["--ft" as string]: `${figTop}px` }}
      >
        <div aria-hidden className="pointer-events-none flex justify-center max-md:pb-10 md:absolute md:top-[var(--ft)] md:left-1/2 md:h-[var(--fh)] md:-translate-x-1/2">
          <Figure mode="scan" className="h-[60svh] w-auto md:h-full" />
        </div>

        {cols.map((lines, c) => (
          <div key={c} className="flex flex-col md:absolute md:inset-x-0 md:top-0">
            {lines.map((t, i) => (
              <Line
                key={t}
                text={t}
                style={style(c as 0 | 1, i)}
                className={
                  c === 0
                    ? "md:text-right md:whitespace-nowrap md:[padding-right:var(--pr)]"
                    : "md:text-left md:whitespace-nowrap md:[padding-left:var(--pl)]"
                }
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
