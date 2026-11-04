"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { FIG_H, FIG_W, getField } from "./figure";
import { useReducedMotion } from "./useReducedMotion";

export type FigureMode = "noise" | "scan" | "mask";

const c8 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

/**
 * The figure, painted pixel by pixel at its logical size and scaled up crisp.
 *  - noise: a grey form dithered with saturated colour speckle
 *  - scan:  a blue duotone with scanlines and an RGB split
 *  - mask:  a flat white silhouette, drawn once
 */
export default function Figure({ mode, className = "", style }: { mode: FigureMode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { sdf, lum } = getField();
    const img = ctx.createImageData(FIG_W, FIG_H);
    const px = img.data;

    const draw = (t: number) => {
      let seed = ((Math.floor(t / 90) + 1) * 2654435761) >>> 0;
      const rnd = () => {
        seed ^= seed << 13;
        seed >>>= 0;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        seed >>>= 0;
        return seed / 4294967296;
      };
      const phase = Math.floor(t / 70);
      for (let y = 0; y < FIG_H; y++) {
        for (let x = 0; x < FIG_W; x++) {
          const i = y * FIG_W + x;
          const o = i * 4;
          const d = sdf[i];
          if (d > 0.5) {
            px[o + 3] = 0;
            continue;
          }
          px[o + 3] = Math.min(1, 0.5 - d) * 255;
          const l = lum[i];
          if (mode === "mask") {
            px[o] = px[o + 1] = px[o + 2] = 255;
          } else if (mode === "noise") {
            // A dim grey form, speckled with saturated green, magenta and blue.
            const v = 8 + l * 120;
            const n = rnd();
            let r = v;
            let g = v;
            let b = v;
            if (n < 0.3) { g += 135; r -= 60; b -= 60; }
            else if (n < 0.55) { r += 120; b += 125; g -= 70; }
            else if (n < 0.78) { b += 145; r -= 50; g -= 20; }
            else { const k = (rnd() - 0.5) * 50; r += k; g += k; b += k; }
            px[o] = c8(r);
            px[o + 1] = c8(g);
            px[o + 2] = c8(b);
          } else {
            const lr = lum[i - 2 < 0 ? i : i - 2];
            const lb = lum[i + 2 >= lum.length ? i : i + 2];
            const s = (y + phase) % 3 === 0 ? 0.5 : 1;
            const glow = l > 0.82 ? (l - 0.82) * 700 : 0;
            px[o] = c8((12 + 80 * lr) * s + glow);
            px[o + 1] = c8((34 + 150 * l) * s + glow);
            px[o + 2] = c8((74 + 181 * lb) * s + glow * 0.8);
          }
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    draw(0);
    if (mode === "mask" || reduced) return;

    let raf = 0;
    let visible = false;
    let last = 0;
    const loop = (now: number) => {
      raf = 0;
      if (!visible) return;
      if (now - last > 90) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [mode, reduced]);

  return <canvas ref={ref} width={FIG_W} height={FIG_H} aria-hidden className={className} style={{ imageRendering: "pixelated", ...style }} />;
}
