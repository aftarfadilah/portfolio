"use client";

import { useEffect, useRef, useState } from "react";
import { serif, type T } from "./shared";

/**
 * A veil of smoke over the whole screen. Swipe (touch) or wipe (mouse) to clear it;
 * what you uncover starts to move. Past about half cleared, the rest dissolves by itself.
 * The button is the keyboard route through.
 *
 * Two drifting smoke textures are composited each frame and cut by a mask that the wipe erases.
 * The smoke itself is domain-warped fractal noise, drawn once at low resolution and stretched,
 * which is what gives it soft billows instead of grain.
 */

const GOAL = 0.55; // fraction cleared at which the rest lifts
const FADE_MS = 1600;
const SCALE = 0.5; // the haze renders at half resolution: smoke is soft, and it is cheap
const TILE_W = 224;
const TILE_H = 140;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function hash(x: number, y: number, seed: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Value noise on a lattice that wraps every `period` cells, so the texture tiles. */
function vnoise(x: number, y: number, period: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const x0 = ((xi % period) + period) % period;
  const y0 = ((yi % period) + period) % period;
  const x1 = (x0 + 1) % period;
  const y1 = (y0 + 1) % period;
  return lerp(lerp(hash(x0, y0, seed), hash(x1, y0, seed), u), lerp(hash(x0, y1, seed), hash(x1, y1, seed), u), v);
}

function fbm(x: number, y: number, base: number, octaves: number, seed: number): number {
  let amp = 0.5;
  let f = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * vnoise(x * base * f, y * base * f, base * f, seed + o * 17);
    norm += amp;
    f *= 2;
    amp *= 0.5;
  }
  return sum / norm;
}

/** One tileable tile of smoke: milky ash grey, lit warm from one side. */
function smokeTile(seed: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = TILE_W;
  c.height = TILE_H;
  const g = c.getContext("2d")!;
  const img = g.createImageData(TILE_W, TILE_H);
  for (let py = 0; py < TILE_H; py++) {
    for (let px = 0; px < TILE_W; px++) {
      const x = px / TILE_W;
      const y = py / TILE_H;
      // domain warp: the noise is bent by other noise, which makes it billow like smoke
      const wx = fbm(x, y, 3, 4, seed + 1);
      const wy = fbm(x + 5.2, y + 1.3, 3, 4, seed + 2);
      const v = fbm(x + 0.55 * (wx - 0.5), y + 0.55 * (wy - 0.5), 3, 5, seed + 3);
      const k = smooth(0.26, 0.76, v);
      const sun = smooth(0.35, 0.85, fbm(x, y, 2, 3, seed + 9)) * smooth(0.5, 1, k) * 0.38;
      let r = lerp(98, 214, k);
      let gr = lerp(91, 205, k);
      let b = lerp(86, 195, k);
      r = lerp(r, 238, sun);
      gr = lerp(gr, 178, sun);
      b = lerp(b, 124, sun);
      const i = (py * TILE_W + px) * 4;
      img.data[i] = r;
      img.data[i + 1] = gr;
      img.data[i + 2] = b;
      img.data[i + 3] = 255 * (0.975 + 0.025 * k);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

export default function Haze({ t, onStart, onCleared }: { t: T; onStart: () => void; onCleared: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [touched, setTouched] = useState(false);
  const [lifting, setLifting] = useState(false);
  const [gone, setGone] = useState(false);
  const lift = useRef<() => void>(() => {});

  useEffect(() => {
    const el = box.current;
    const c = cv.current;
    if (!el || !c) return;
    const g = c.getContext("2d");
    if (!g) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tileA = smokeTile(11);
    const tileB = smokeTile(73);

    let W = 0;
    let H = 0;
    let dw = 1;
    let dh = 1;
    let mask = document.createElement("canvas");
    let mg = mask.getContext("2d", { willReadFrequently: true })!;
    let last: { x: number; y: number } | null = null;
    let lastCheck = 0;
    let done = false;
    let started = false;
    let hasMask = false;
    let raf = 0;
    let timer = 0;
    const t0 = performance.now();

    const sample = document.createElement("canvas");
    sample.width = 40;
    sample.height = 24;
    const sg = sample.getContext("2d", { willReadFrequently: true })!;

    const render = (now: number) => {
      const time = reduced ? 3 : (now - t0) / 1000;
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;
      g.clearRect(0, 0, dw, dh);
      const tw = dw * 1.6;
      const th = dh * 1.3;
      // layer one drifts right and bobs a little
      const ox = (time * 10 * SCALE) % tw;
      const oy = -(th - dh) / 2 + Math.sin(time * 0.09) * 10 * SCALE;
      g.drawImage(tileA, -ox, oy, tw, th);
      g.drawImage(tileA, -ox + tw, oy, tw, th);
      // layer two drifts the other way, translucent, so the billows slide past each other
      const o2 = (time * 6 * SCALE) % tw;
      const y2 = -(th - dh) / 2 + Math.cos(time * 0.07) * 12 * SCALE;
      g.globalAlpha = 0.55;
      g.drawImage(tileB, o2 - tw, y2, tw, th);
      g.drawImage(tileB, o2, y2, tw, th);
      g.globalAlpha = 1;
      // cut it by the mask: where you have wiped, nothing is left
      g.globalCompositeOperation = "destination-in";
      g.drawImage(mask, 0, 0, dw, dh);
      g.globalCompositeOperation = "source-over";
    };

    const loop = (now: number) => {
      render(now);
      raf = requestAnimationFrame(loop);
    };

    const layout = () => {
      const r = el.getBoundingClientRect();
      const nw = Math.max(1, Math.round(r.width));
      const nh = Math.max(1, Math.round(r.height));
      if (W && Math.abs(nw - W) < 2 && Math.abs(nh - H) < 2) return;
      W = nw;
      H = nh;
      dw = Math.max(1, Math.round(W * SCALE));
      dh = Math.max(1, Math.round(H * SCALE));
      c.width = dw;
      c.height = dh;
      // keep what has been cleared when the viewport changes (mobile toolbars do this)
      const old = mask;
      mask = document.createElement("canvas");
      mask.width = dw;
      mask.height = dh;
      mg = mask.getContext("2d", { willReadFrequently: true })!;
      if (hasMask) mg.drawImage(old, 0, 0, dw, dh);
      else {
        mg.fillStyle = "#000";
        mg.fillRect(0, 0, dw, dh);
      }
      hasMask = true;
      if (reduced) render(performance.now());
    };

    const finish = () => {
      if (done) return;
      done = true;
      setLifting(true);
      onCleared();
      timer = window.setTimeout(() => setGone(true), FADE_MS + 100);
    };
    lift.current = () => {
      if (!started) {
        started = true;
        setTouched(true);
        onStart();
      }
      finish();
    };

    const cleared = () => {
      sg.clearRect(0, 0, 40, 24);
      sg.drawImage(mask, 0, 0, 40, 24);
      const d = sg.getImageData(0, 0, 40, 24).data;
      let a = 0;
      for (let i = 3; i < d.length; i += 4) a += d[i];
      return 1 - a / (255 * 40 * 24);
    };

    const wipe = (x: number, y: number) => {
      const r = Math.max(76, Math.min(W, H) * 0.15) * SCALE;
      mg.globalCompositeOperation = "destination-out";
      const stamp = (px: number, py: number) => {
        const grad = mg.createRadialGradient(px, py, 0, px, py, r);
        grad.addColorStop(0, "rgba(0,0,0,1)");
        grad.addColorStop(0.3, "rgba(0,0,0,0.92)");
        grad.addColorStop(0.65, "rgba(0,0,0,0.45)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        mg.fillStyle = grad;
        mg.fillRect(px - r, py - r, r * 2, r * 2);
      };
      const mx = x * SCALE;
      const my = y * SCALE;
      if (last) {
        const dx = mx - last.x;
        const dy = my - last.y;
        const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (r * 0.3)));
        for (let i = 1; i <= steps; i++) stamp(last.x + (dx * i) / steps, last.y + (dy * i) / steps);
      } else stamp(mx, my);
      mg.globalCompositeOperation = "source-over";
      last = { x: mx, y: my };
      if (reduced) render(performance.now());
    };

    const point = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      return { x: e.clientX - b.left, y: e.clientY - b.top };
    };
    const onMove = (e: PointerEvent) => {
      if (done) return;
      // a mouse wipes just by moving; a finger or pen has to be down
      if (e.pointerType !== "mouse" && e.buttons === 0) return;
      const p = point(e);
      if (!started) {
        started = true;
        setTouched(true);
        onStart();
      }
      wipe(p.x, p.y);
      const now = performance.now();
      if (now - lastCheck > 160) {
        lastCheck = now;
        if (cleared() >= GOAL) finish();
      }
    };
    const onDown = (e: PointerEvent) => {
      // a press on the button is a click, not a wipe (capturing the pointer would swallow it)
      if ((e.target as Element | null)?.closest("button")) return;
      last = null;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
      onMove(e);
    };
    const onUp = () => {
      last = null;
      if (!done && started && cleared() >= GOAL) finish();
    };
    const onLeave = () => {
      last = null;
    };

    layout();
    if (reduced) render(performance.now());
    else raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(layout);
    ro.observe(el);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.clearTimeout(timer);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", onLeave);
    };
    // onStart / onCleared are stable setters from the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <div
      ref={box}
      className="absolute inset-0 z-30 cursor-grab touch-none select-none"
      style={{ opacity: lifting ? 0 : 1, transition: `opacity ${FADE_MS}ms ease-out`, pointerEvents: lifting ? "none" : "auto" }}
    >
      <canvas ref={cv} aria-hidden="true" className="h-full w-full" />
      <div className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center transition-opacity duration-700 ${touched ? "opacity-0" : "opacity-100"}`}>
        <p className={`${serif} text-4xl text-[#1a1410] sm:text-6xl`}>{t("hazeHint")}</p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#1a1410]/80">{t("hazeSub")}</p>
        <svg className="mt-8 h-10 w-10 animate-pulse text-[#1a1410]/70" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M6 24c6-8 10 4 16-4s8 2 12-4" strokeLinecap="round" />
          <path d="M6 31c6-8 10 4 16-4s8 2 12-4" strokeLinecap="round" opacity="0.5" />
        </svg>
      </div>
      <button
        type="button"
        onClick={() => lift.current()}
        className="absolute bottom-7 left-1/2 -translate-x-1/2 border border-[#1a1410]/60 bg-[#efe7dc]/30 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[#1a1410] backdrop-blur-sm hover:bg-[#efe7dc]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1410]"
      >
        {t("hazeSkip")}
      </button>
    </div>
  );
}
