"use client";

import { useEffect, useRef, useState } from "react";
import { LABELS, LAND, SNAPSHOT_URL, type Key } from "@/data/karhutla";
import { serif, type T } from "./shared";

/**
 * Every glowing point is one real satellite detection (NASA FIRMS, VIIRS S-NPP).
 * A scan line sweeps the map once on load, as the satellite does, then comes back now and then.
 * Hover (or tap) a point to read the pixel: brightness temperature, radiative power, confidence.
 */

type Snapshot = { n: number; p: number[][] };
export type Stats = { n: number; high: number; medium: number; low: number };
type Hover = { x: number; y: number; conf: 0 | 1 | 2; k: number; frp: number };

const INTRO = 4.6; // seconds for the first pass
const PERIOD = 10; // seconds between later passes
const REACH = 30; // px, how close the pointer must be to pick a point
const CONF_KEY: Key[] = ["conf_h", "conf_n", "conf_l"];
const CONF_DESC: Key[] = ["conf_h_d", "conf_n_d", "conf_l_d"];
const CONF_COLOR = ["#ff5a1f", "#ff9a3c", "#8f979f"];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** x of the first scan line: an even sweep that eases in and out, like a satellite pass. */
const introPos = (time: number, w: number) => (1 - Math.cos(Math.PI * clamp(time / INTRO, 0, 1))) / 2 * (w + 220) - 100;

function sprite(core: string, color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, core);
  grad.addColorStop(0.16, color);
  grad.addColorStop(0.45, color + "55");
  grad.addColorStop(1, color + "00");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

function inside(x: number, y: number, poly: [number, number][]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

export default function HotspotField({ t, onStats }: { t: T; onStats: (s: Stats) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const [size, setSize] = useState({ w: 1280, h: 800 });
  // Latest callbacks, so the long-lived effect below never goes stale.
  const stats = useRef(onStats);
  const labels = useRef<string[]>([]);
  const rebuild = useRef<() => void>(() => {});
  useEffect(() => {
    stats.current = onStats;
  }, [onStats]);
  // Place names follow the language without restarting the animation.
  useEffect(() => {
    labels.current = LABELS.map((l) => t(l.key).toUpperCase());
    rebuild.current();
  }, [t]);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctl = new AbortController();
    const sprites = [sprite("#ffc9a0", "#ff4a14"), sprite("#ffd9a8", "#ff8a2a"), sprite("#d5dadf", "#8f979f")];
    let t0 = performance.now();

    let W = 0;
    let H = 0;
    let dpr = 1;
    let n = 0;
    let lon = new Float32Array(0);
    let lat = new Float32Array(0);
    let conf = new Uint8Array(0);
    let kel = new Uint16Array(0);
    let frp = new Float32Array(0);
    let sx = new Float32Array(0);
    let sy = new Float32Array(0);
    let rad = new Float32Array(0);
    let phase = new Float32Array(0);
    let speed = new Float32Array(0);
    let still: HTMLCanvasElement | null = null;
    let picked = -1;
    let raf = 0;

    /** Framing: wide screens show the whole archipelago, narrow ones crop to Sumatra and Kalimantan. */
    const frame = () => {
      const narrow = W < 720;
      const span = narrow ? 24 : 47;
      const s = W / span;
      const cLon = narrow ? 109.5 : 118.5;
      const cLat = narrow ? -2.6 : -2.8;
      const cy = narrow ? H * 0.5 : H * 0.6;
      return { s, x: (lo: number) => W / 2 + (lo - cLon) * s, y: (la: number) => cy - (la - cLat) * s };
    };

    /** Faint dot-matrix land, graticule and place names: drawn once per resize. */
    const buildStill = () => {
      const c = document.createElement("canvas");
      c.width = W * dpr;
      c.height = H * dpr;
      const g = c.getContext("2d")!;
      g.scale(dpr, dpr);
      const f = frame();
      const top = f.y(8);
      const bottom = f.y(-12);

      g.strokeStyle = "rgba(239,231,220,0.07)";
      g.lineWidth = 1;
      g.beginPath();
      for (let lo = 95; lo <= 140; lo += 5) {
        g.moveTo(Math.round(f.x(lo)) + 0.5, top);
        g.lineTo(Math.round(f.x(lo)) + 0.5, bottom);
      }
      for (let la = 5; la >= -10; la -= 5) {
        g.moveTo(0, Math.round(f.y(la)) + 0.5);
        g.lineTo(W, Math.round(f.y(la)) + 0.5);
      }
      g.stroke();

      g.fillStyle = "rgba(239,231,220,0.3)";
      for (let la = 7.5; la > -11.5; la -= 0.34) {
        for (let lo = 94; lo < 141.5; lo += 0.34) {
          if (LAND.some((p) => inside(lo, la, p))) g.fillRect(f.x(lo) - 0.7, f.y(la) - 0.7, 1.5, 1.5);
        }
      }

      g.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      g.fillStyle = "rgba(239,231,220,0.55)";
      g.textAlign = "center";
      if ("letterSpacing" in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "2px";
      LABELS.forEach((l, i) => g.fillText(labels.current[i] ?? "", f.x(l.lon), f.y(l.lat)));
      g.fillStyle = "rgba(239,231,220,0.38)";
      for (let lo = 100; lo <= 140; lo += 10) g.fillText(`${lo}°E`, f.x(lo), bottom + 14);
      g.textAlign = "right";
      for (const la of [5, 0, -5, -10]) g.fillText(la === 0 ? "0°" : `${Math.abs(la)}°${la > 0 ? "N" : "S"}`, W - 10, f.y(la) - 5);
      return c;
    };

    const layout = () => {
      const r = el.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * dpr;
      cv.height = H * dpr;
      setSize({ w: W, h: H });
      still = buildStill();
      const f = frame();
      for (let i = 0; i < n; i++) {
        sx[i] = f.x(lon[i]);
        sy[i] = f.y(lat[i]);
      }
    };

    rebuild.current = () => {
      if (!W) return;
      still = buildStill();
      if (reduced) draw(performance.now());
    };

    const draw = (now: number) => {
      if (!still) return;
      const time = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(still, 0, 0, W, H);

      // satellite pass: the first one reveals the data, later ones just brighten what they cross
      const e = clamp(time / INTRO, 0, 1);
      const introX = reduced ? W + 200 : introPos(time, W);
      const later = time - INTRO - 1.5;
      const scanX = reduced || later < 0 ? -9999 : (later % PERIOD) / PERIOD * (W + 520) - 260;

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < n; i++) {
        const vis = clamp((introX - sx[i]) / 90, 0, 1);
        if (vis <= 0) continue;
        const d = scanX - sx[i];
        const bump = d >= 0 && d < 170 ? 1 - d / 170 : 0;
        const tw = reduced ? 0.8 : 0.72 + 0.28 * Math.sin(time * speed[i] + phase[i]);
        ctx.globalAlpha = clamp(vis * (tw * 0.5 + bump * 0.8), 0, 1);
        const r = rad[i] * (1 + 0.35 * bump);
        ctx.drawImage(sprites[conf[i]], sx[i] - r, sy[i] - r, r * 2, r * 2);
      }

      // the scan line itself
      const lines: number[] = [];
      if (!reduced && e < 1) lines.push(introX);
      if (scanX > -300 && scanX < W + 300) lines.push(scanX);
      for (const x of lines) {
        const grad = ctx.createLinearGradient(x - 120, 0, x, 0);
        grad.addColorStop(0, "rgba(255,150,70,0)");
        grad.addColorStop(1, "rgba(255,150,70,0.05)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.fillRect(x - 120, 0, 120, H);
        ctx.fillStyle = "rgba(255,190,140,0.45)";
        ctx.fillRect(x, 0, 1, H);
      }

      // reticle on the picked pixel
      if (picked >= 0) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.95)";
        ctx.lineWidth = 1;
        const x = sx[picked];
        const y = sy[picked];
        const r = Math.max(11, rad[picked] * 0.7 + 7);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.moveTo(x - r - 6, y);
        ctx.lineTo(x - r + 3, y);
        ctx.moveTo(x + r - 3, y);
        ctx.lineTo(x + r + 6, y);
        ctx.moveTo(x, y - r - 6);
        ctx.lineTo(x, y - r + 3);
        ctx.moveTo(x, y + r - 3);
        ctx.lineTo(x, y + r + 6);
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };

    const pick = (clientX: number, clientY: number) => {
      const r = el.getBoundingClientRect();
      const px = clientX - r.left;
      const py = clientY - r.top;
      let best = -1;
      let bd = REACH * REACH;
      const time = (performance.now() - t0) / 1000;
      const introX = reduced ? W + 200 : introPos(time, W);
      for (let i = 0; i < n; i++) {
        if (sx[i] > introX) continue;
        const dx = sx[i] - px;
        const dy = sy[i] - py;
        const d = dx * dx + dy * dy - (conf[i] === 0 ? 120 : 0); // high-confidence points are easier to catch
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      if (best === picked) return;
      picked = best;
      setHover(best < 0 ? null : { x: sx[best], y: sy[best], conf: conf[best] as 0 | 1 | 2, k: kel[best], frp: Math.round(frp[best] * 10) / 10 });
      if (reduced) draw(performance.now());
    };

    const onMove = (e: PointerEvent) => pick(e.clientX, e.clientY);
    const onLeave = () => {
      picked = -1;
      setHover(null);
      if (reduced) draw(performance.now());
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onMove);
    el.addEventListener("pointerleave", onLeave);

    const ro = new ResizeObserver(() => {
      layout();
      if (reduced) draw(performance.now());
    });
    ro.observe(el);

    fetch(SNAPSHOT_URL, { signal: ctl.signal })
      .then((r) => r.json() as Promise<Snapshot>)
      .then((d) => {
        n = d.p.length;
        lon = new Float32Array(n);
        lat = new Float32Array(n);
        conf = new Uint8Array(n);
        kel = new Uint16Array(n);
        frp = new Float32Array(n);
        sx = new Float32Array(n);
        sy = new Float32Array(n);
        rad = new Float32Array(n);
        phase = new Float32Array(n);
        speed = new Float32Array(n);
        const counts = [0, 0, 0];
        d.p.forEach(([lo, la, c, k, p], i) => {
          lon[i] = lo;
          lat[i] = la;
          conf[i] = c;
          kel[i] = k;
          frp[i] = p;
          counts[c]++;
          const base = 2.4 + Math.sqrt(p) * 0.8;
          rad[i] = clamp(c === 2 ? base * 0.7 : base, 2.2, 7.5);
          phase[i] = (i * 2.399) % (Math.PI * 2);
          speed[i] = 0.8 + ((i * 7) % 11) / 8;
        });
        t0 = performance.now();
        layout();
        stats.current({ n, high: counts[0], medium: counts[1], low: counts[2] });
        if (reduced) draw(performance.now());
        else raf = requestAnimationFrame(loop);
      })
      .catch(() => {});

    return () => {
      ctl.abort();
      cancelAnimationFrame(raf);
      ro.disconnect();
      rebuild.current = () => {};
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const tipW = 256;
  const left = hover ? clamp(hover.x + 18, 8, size.w - tipW - 8) : 0;
  const top = hover ? clamp(hover.y - 24, 70, size.h - 190) : 0;

  return (
    <div ref={wrap} className="absolute inset-0 touch-pan-y">
      <canvas ref={canvas} className="h-full w-full" role="img" aria-label={t("mapAria")} style={{ width: "100%", height: "100%" }} />
      {hover && (
        <div className="pointer-events-none absolute z-20 border border-white/20 bg-[#0a0706]/90 p-4 backdrop-blur-sm" style={{ left, top, width: tipW }} aria-live="polite">
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CONF_COLOR[hover.conf] }} />
            {t(CONF_KEY[hover.conf])}
          </p>
          <p className={`${serif} mt-2 text-4xl leading-none tabular-nums`}>
            {hover.k}
            <span className="ml-1 text-lg opacity-50">K</span>
          </p>
          <p className="mt-1 text-xs opacity-60">
            {t("hoverK")} · {t("hoverFrp")} {hover.frp} MW
          </p>
          <p className="mt-3 text-xs leading-relaxed opacity-80">{t(CONF_DESC[hover.conf])}</p>
          <p className="mt-2 text-xs italic opacity-60">{t("hoverNote")}</p>
        </div>
      )}
    </div>
  );
}
