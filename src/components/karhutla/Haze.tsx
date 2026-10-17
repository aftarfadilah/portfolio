"use client";

import { useEffect, useRef, useState } from "react";
import { serif, type T } from "./shared";

/**
 * A veil of smoke over the whole screen. Swipe (touch) or wipe (mouse) to clear it;
 * what you uncover starts to move. Past about half cleared, the rest dissolves by itself.
 * The button is the keyboard route through.
 */

const GOAL = 0.55; // fraction cleared at which the rest lifts
const FADE_MS = 1500;

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function paintHaze(g: CanvasRenderingContext2D, W: number, H: number) {
  const u = Math.max(W, H) / 1000;
  const base = g.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, Math.max(W, H) * 0.75);
  base.addColorStop(0, "#85705b");
  base.addColorStop(1, "#3f3128");
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);

  const r = rng(7);
  for (let i = 0; i < 110; i++) {
    const x = r() * W;
    const y = r() * H;
    const rad = (90 + r() * 280) * u;
    const light = r() > 0.45;
    const a = light ? 0.07 + r() * 0.12 : 0.14 + r() * 0.2;
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    const c = light ? "214,178,140" : "36,26,21";
    grad.addColorStop(0, `rgba(${c},${a})`);
    grad.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = grad;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 5000; i++) {
    const v = r() > 0.5 ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},${0.02 + r() * 0.04})`;
    g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2);
  }
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
    const g = c.getContext("2d", { willReadFrequently: true });
    if (!g) return;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let last: { x: number; y: number } | null = null;
    let lastCheck = 0;
    let done = false;
    let started = false;
    let timer = 0;

    const sample = document.createElement("canvas");
    sample.width = 40;
    sample.height = 24;
    const sg = sample.getContext("2d", { willReadFrequently: true })!;

    const layout = () => {
      const r = el.getBoundingClientRect();
      const nw = Math.max(1, Math.round(r.width));
      const nh = Math.max(1, Math.round(r.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      if (W && Math.abs(nw - W) < 2 && Math.abs(nh - H) < 2) return;
      // Keep what has been cleared when the viewport changes (mobile toolbars do this).
      const old = W ? document.createElement("canvas") : null;
      if (old) {
        old.width = c.width;
        old.height = c.height;
        old.getContext("2d")!.drawImage(c, 0, 0);
      }
      W = nw;
      H = nh;
      c.width = W * dpr;
      c.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.globalCompositeOperation = "source-over";
      if (old) g.drawImage(old, 0, 0, W, H);
      else paintHaze(g, W, H);
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
      sg.drawImage(c, 0, 0, 40, 24);
      const d = sg.getImageData(0, 0, 40, 24).data;
      let a = 0;
      for (let i = 3; i < d.length; i += 4) a += d[i];
      return 1 - a / (255 * 40 * 24);
    };

    const wipe = (x: number, y: number) => {
      const r = Math.max(64, Math.min(W, H) * 0.12);
      g.globalCompositeOperation = "destination-out";
      const stamp = (px: number, py: number) => {
        const grad = g.createRadialGradient(px, py, 0, px, py, r);
        grad.addColorStop(0, "rgba(0,0,0,1)");
        grad.addColorStop(0.55, "rgba(0,0,0,0.85)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grad;
        g.fillRect(px - r, py - r, r * 2, r * 2);
      };
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (r * 0.3)));
        for (let i = 1; i <= steps; i++) stamp(last.x + (dx * i) / steps, last.y + (dy * i) / steps);
      } else stamp(x, y);
      g.globalCompositeOperation = "source-over";
      last = { x, y };
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

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(el);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", () => (last = null));
    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
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
        <p className={`${serif} text-4xl text-[#f6ede1] drop-shadow-[0_2px_18px_rgba(30,20,14,0.6)] sm:text-6xl`}>{t("hazeHint")}</p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#f1e4d3]/85">{t("hazeSub")}</p>
        <svg className="mt-8 h-10 w-10 animate-pulse text-[#f6ede1]/80" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M6 24c6-8 10 4 16-4s8 2 12-4" strokeLinecap="round" />
          <path d="M6 31c6-8 10 4 16-4s8 2 12-4" strokeLinecap="round" opacity="0.5" />
        </svg>
      </div>
      <button
        type="button"
        onClick={() => lift.current()}
        className="absolute bottom-7 left-1/2 -translate-x-1/2 border border-[#f6ede1]/50 bg-[#2a1f19]/40 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[#f6ede1] backdrop-blur-sm hover:bg-[#2a1f19]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6ede1]"
      >
        {t("hazeSkip")}
      </button>
    </div>
  );
}
