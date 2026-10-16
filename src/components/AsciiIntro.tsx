"use client";

import { useEffect, useRef } from "react";

const RAMP = " .:-=+*#%@";
const SCRAMBLE = "01<>/\\{}[]()=+*#%@$&?!;:";
const TIERS = [
  "rgba(59, 105, 204, 0.16)",
  "rgba(59, 105, 204, 0.30)",
  "rgba(96, 140, 235, 0.55)",
  "rgba(214, 226, 255, 0.95)",
];

const SWEEP_END = 2.2; // seconds until the scramble has settled everywhere
const MASK_IN = 0.7;
const MASK_OUT_START = 2.6;
const MASK_OUT_END = 3.6;
export const ASCII_INTRO_DURATION = MASK_OUT_END;

function clamp(v: number, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, v));
}

function smooth(a: number, b: number, v: number) {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Fullscreen animated ASCII field with a Aino-style loading intro. */
export default function AsciiIntro() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -9999, y: -9999, active: false };
    let cols = 0;
    let rows = 0;
    let cw = 8;
    let ch = 16;
    let fontSize = 12;
    let family = "monospace";
    let mask = new Float32Array(0);
    let raf = 0;
    let disposed = false;
    const start = performance.now();

    const buildMask = () => {
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const o = off.getContext("2d");
      if (!o) return;
      o.clearRect(0, 0, cols, rows);
      o.fillStyle = "#fff";
      o.textAlign = "center";
      o.textBaseline = "middle";
      // Cells are ~1:2, so squash text vertically to look right on the grid.
      const label = "AFTAR FADILAH";
      let size = Math.floor((cols * 0.86) / (label.length * 0.72));
      size = Math.min(size, Math.floor(rows * 0.5));
      o.font = `800 ${size}px sans-serif`;
      o.save();
      o.translate(cols / 2, rows / 2);
      o.scale(1, 0.5);
      o.fillText(label, 0, 0);
      o.restore();
      const data = o.getImageData(0, 0, cols, rows).data;
      mask = new Float32Array(cols * rows);
      for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] / 255;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fontSize = w < 640 ? 10 : 12;
      ctx.font = `${fontSize}px ${family}`;
      cw = ctx.measureText("M").width || fontSize * 0.6;
      ch = Math.round(fontSize * 1.4);
      cols = Math.ceil(w / cw) + 1;
      rows = Math.ceil(h / ch) + 1;
      buildMask();
    };

    const frame = (now: number) => {
      if (disposed) return;
      const t = reduced ? ASCII_INTRO_DURATION + 1 : (now - start) / 1000;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${fontSize}px ${family}`;
      ctx.textBaseline = "top";

      const sweep = clamp(t / SWEEP_END) * 1.25;
      const maskAmt =
        smooth(0.4, MASK_IN + 0.8, t) * (1 - smooth(MASK_OUT_START, MASK_OUT_END, t));
      const settled = smooth(MASK_OUT_START, MASK_OUT_END + 0.4, t);
      const baseGain = 0.5 - 0.18 * settled; // dim the field once content shows
      const tick = Math.floor(t * 14);

      const lines: string[][] = TIERS.map(() => new Array<string>(rows));
      for (let tier = 0; tier < TIERS.length; tier++) {
        for (let y = 0; y < rows; y++) lines[tier][y] = "";
      }
      const rowBuf: string[][] = TIERS.map(() => new Array<string>(cols));

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const nx = x / cols;
          let tier = -1;
          let glyph = " ";

          const m = mask[y * cols + x] * maskAmt;
          if (nx > sweep) {
            // Not reached by the sweep yet: blank.
          } else if (sweep - nx < 0.12 && t < SWEEP_END + 0.3) {
            // Scramble front trailing the sweep.
            const r = Math.sin((x * 12.9898 + y * 78.233 + tick * 37.719) * 43758.5453);
            glyph = SCRAMBLE[Math.floor((r - Math.floor(r)) * SCRAMBLE.length)];
            tier = 3;
          } else {
            // Flowing field.
            let v =
              0.5 +
              0.25 * Math.sin(x * 0.09 + t * 0.7 + Math.sin(y * 0.12 - t * 0.45) * 1.6) +
              0.25 * Math.sin(y * 0.16 + x * 0.04 - t * 0.55);
            if (pointer.active) {
              const dx = x * cw - pointer.x;
              const dy = y * ch - pointer.y;
              const d = Math.sqrt(dx * dx + dy * dy);
              if (d < 220) {
                const fall = 1 - d / 220;
                v += fall * fall * (0.55 + 0.25 * Math.sin(d * 0.08 - t * 7));
              }
            }
            v = clamp(v * baseGain * 2);
            const idx = Math.floor(v * (RAMP.length - 1));
            glyph = RAMP[idx];
            tier = idx < 3 ? 0 : idx < 5 ? 1 : idx < 7 ? 2 : 3;
          }

          if (m > 0.35) {
            glyph = "@#%8&"[(x + y + tick) % 5];
            tier = 3;
          }

          for (let k = 0; k < TIERS.length; k++) {
            rowBuf[k][x] = k === tier && glyph !== " " ? glyph : " ";
          }
        }
        for (let k = 0; k < TIERS.length; k++) lines[k][y] = rowBuf[k].join("");
      }

      for (let k = 0; k < TIERS.length; k++) {
        ctx.fillStyle = TIERS[k];
        for (let y = 0; y < rows; y++) ctx.fillText(lines[k][y], 0, y * ch);
      }

      // Loading counter.
      if (t < MASK_OUT_END) {
        const pct = Math.round(clamp(t / SWEEP_END) * 100);
        const alpha = 1 - smooth(MASK_OUT_START, MASK_OUT_END, t);
        ctx.font = `${fontSize + 2}px ${family}`;
        ctx.fillStyle = `rgba(214, 226, 255, ${0.9 * alpha})`;
        ctx.fillText(`LOADING ${String(pct).padStart(3, "0")}%`, 20, h - 36);
      }

      if (!reduced) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active =
        pointer.x >= 0 && pointer.y >= 0 && pointer.x <= r.width && pointer.y <= r.height;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    const init = () => {
      if (disposed) return;
      family =
        getComputedStyle(canvas).getPropertyValue("--font-geist-mono").trim() ||
        "monospace";
      resize();
      raf = requestAnimationFrame(frame);
    };
    document.fonts.ready.then(init);

    const ro = new ResizeObserver(() => cols && resize());
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
