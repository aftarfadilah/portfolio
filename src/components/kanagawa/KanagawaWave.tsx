"use client";

import { useEffect, useRef } from "react";

// Kanagawa (wave) palette, as used by kanagawa.nvim.
const STEPS = 6;
const COLORS: string[] = [];

function hex(h: string) {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** Registers a STEPS-long colour ramp and returns the index of its first colour. */
function ramp(from: string, to: string) {
  const base = COLORS.length;
  const a = hex(from);
  const b = hex(to);
  for (let i = 0; i < STEPS; i++) {
    const k = i / (STEPS - 1);
    const c = (j: number) => Math.round(a[j] + (b[j] - a[j]) * k);
    COLORS.push(`rgb(${c(0)}, ${c(1)}, ${c(2)})`);
  }
  return base;
}

const R_CLOUD = ramp("#2a2a37", "#54546d"); // sumiInk4 -> sumiInk6
const R_STAR = ramp("#54546d", "#dcd7ba"); // -> fujiWhite
const R_SEA_FAR = ramp("#223249", "#2d4f67"); // waveBlue1 -> waveBlue2
const R_SEA = ramp("#2d4f67", "#7fb4ca"); // waveBlue2 -> springBlue
const R_BODY = ramp("#2d4f67", "#7e9cd8"); // waveBlue2 -> crystalBlue
const R_FOAM = ramp("#a3d4d5", "#dcd7ba"); // lightBlue -> fujiWhite
const R_FUJI = ramp("#54546d", "#957fb8"); // sumiInk6 -> oniViolet
const R_SNOW = ramp("#7fb4ca", "#dcd7ba"); // springBlue -> fujiWhite
const R_SUN = ramp("#c34043", "#e6c384"); // autumnRed -> carpYellow
const R_PETAL = ramp("#d27e99", "#e46876"); // sakuraPink -> waveRed
const R_GLOW = ramp("#6b5e3a", "#e6c384"); // dim lantern -> carpYellow
const R_BOAT = ramp("#a08a5b", "#e6c384");

const GL = " .,:;'`^-=~+*oO#%@8&/\\|()<>01";
const g = (c: string) => GL.indexOf(c);
const SCRAMBLE = Array.from("01<>/\\()=+*#%@&8", g);
const FOAM = Array.from("*+'`.*", g);
const PETALS = Array.from("*~,'", g);
const G_DOT = g(".");
const G_COLON = g(":");
const G_DASH = g("-");
const G_EQ = g("=");
const G_TILDE = g("~");
const G_CARET = g("^");
const G_SLASH = g("/");
const G_BACK = g("\\");
const G_LT = g("<");
const G_GT = g(">");
const G_O = g("o");
const G_STAR = g("*");
const SUN_GLYPHS = Array.from("*+#%@", g);

// Scene, in "height units" (1 = scene height). The wave curls over Mt. Fuji.
const OX = 0.86; // x of the wave's crest
const PEAK = 0.22; // y of the crest
const SEA = 0.66; // y of the trough
const HORIZON = 0.6;
const XF = OX + 0.18; // Fuji
const KX = OX + 0.12; // centre of the curl
const KY = 0.4;
const KR = 0.18;
const KT = 0.055; // curl thickness
const ARC_END = Math.PI + 0.55;
const SUN = { x: 0.3, y: 0.17, r: 0.075 };

const INTRO = 2.4;

function clamp(v: number, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, v));
}

function smooth(a: number, b: number, v: number) {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

function hash(x: number, y: number, k: number) {
  const r = Math.sin((x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453);
  return r - Math.floor(r);
}

const step = (base: number, v: number) => base + Math.round(clamp(v) * (STEPS - 1));

type Ripple = { x: number; y: number; t0: number };

/**
 * Fullscreen, animated, coloured ASCII rendition of The Great Wave off
 * Kanagawa in the Kanagawa colour theme. Every cell is sampled from a
 * procedural scene (sky, sun, Fuji, curling wave, sea, boats) and drawn from
 * a pre-rendered glyph atlas, so a full-screen field stays cheap per frame.
 */
export default function KanagawaWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -1, y: -1, active: false, sx: 0 };
    const ripples: Ripple[] = [];
    let atlas: HTMLCanvasElement | null = null;
    let dpr = 1;
    let W = 0;
    let H = 0;
    let cw = 7;
    let ch = 17;
    let cols = 0;
    let rows = 0;
    let family = "monospace";
    let fontSize = 12;
    let raf = 0;
    let disposed = false;
    const start = performance.now();

    // Per-cell result of resolve(): glyph index (0 = blank) and colour index.
    let rg = 0;
    let rc = 0;

    const putFoam = (x: number, y: number, t: number, lo = 0.4) => {
      const h1 = hash(x, y, Math.floor(t * 4));
      rg = FOAM[Math.floor(h1 * FOAM.length)];
      rc = step(R_FOAM, lo + (1 - lo) * hash(y, x, 5));
    };

    /** Sample the scene at one cell; (xs, ys) are scene coordinates. */
    const resolve = (x: number, y: number, xs: number, ys: number, t: number) => {
      rg = 0;
      rc = 0;

      const bob = Math.sin(t * 0.8) * 0.006;
      const ky = KY + bob;
      const kr = KR * (1 + 0.018 * Math.sin(t * 1.1));
      const dx = xs - KX;
      const dy = ys - ky;
      const r = Math.hypot(dx, dy);
      const s = Math.atan2(dy, dx) + Math.PI;
      const tt = KT * (1 - 0.85 * smooth(ARC_END * 0.55, ARC_END, s));
      const inArc = s <= ARC_END;
      const hollow = r < kr - KT * 0.9 && ys < ky + kr * 0.6;

      // Foam claws reaching off the tip of the curl.
      if (s > ARC_END - 0.1 && s < ARC_END + 0.9 && r > kr - 0.05 && r < kr + 0.07) {
        for (let j = 0; j < 5; j++) {
          const a = 0.5 + j * 0.13 + 0.04 * Math.sin(t * 1.7 + j * 1.3);
          const rr = kr - 0.012 + j * 0.008;
          const fx = KX + Math.cos(a) * rr;
          const fy = ky + Math.sin(a) * rr;
          if (Math.hypot(xs - fx, ys - fy) < 0.016 - j * 0.0015) {
            putFoam(x, y, t, 0.6);
            return;
          }
        }
      }

      // The curl itself.
      if (inArc && r <= kr && r >= kr - tt) {
        const q = (kr - r) / tt; // 0 outer edge .. 1 inner edge
        const tip = smooth(ARC_END - 0.5, ARC_END, s);
        if (q < 0.2 || (tip > 0.2 && hash(x, y, Math.floor(t * 3)) < tip * 0.7)) {
          putFoam(x, y, t);
          return;
        }
        const st = Math.sin(r * 90 - t * 0.7 + s * 3) * 0.5 + 0.5;
        rg = st > 0.7 ? G_EQ : st > 0.4 ? G_DASH : G_COLON;
        rc = step(R_BODY, 0.4 + 0.5 * st - 0.2 * q);
        return;
      }

      // The body of the wave, rising from the left to the crest.
      const u = smooth(0, OX, xs);
      const top = xs <= OX ? SEA - (SEA - PEAK) * Math.pow(u, 2.2) + bob : PEAK;
      const wall = ys > ky ? OX - 0.01 + 0.07 * smooth(ky + 0.08, SEA, ys) : OX;
      if (!hollow && ys >= top && xs <= wall && ys <= SEA + 0.05) {
        const d = ys - top;
        if (d < 0.012 + 0.008 * Math.sin(xs * 70 + t * 2)) {
          putFoam(x, y, t, 0.3);
          return;
        }
        const q = Math.sin(d * 70 + xs * 14 - t * 0.5 + Math.sin(xs * 20 + t * 0.4) * 0.8) * 0.5 + 0.5;
        const depth = clamp(d / 0.35);
        rg = q > 0.8 ? G_EQ : q > 0.55 ? G_DASH : q > 0.3 ? G_COLON : G_DOT;
        rc = step(R_BODY, 0.35 + 0.65 * q * (1 - 0.4 * depth));
        return;
      }

      // Spray thrown off the crest.
      if (inArc && s > 0.3 && r > kr && r < kr + 0.06) {
        const p = 0.35 * Math.exp(-(r - kr) / 0.02) * (0.5 + 0.5 * Math.sin(t * 2 + s * 5));
        if (hash(x, y, Math.floor(t * 6)) < p) {
          putFoam(x, y, t, 0.5);
          return;
        }
      }
      if (xs < OX && xs > OX - 0.4 && ys < top && ys > top - 0.05) {
        const p = 0.12 * Math.exp((ys - top) / 0.02);
        if (hash(x, y, Math.floor(t * 5)) < p) {
          putFoam(x, y, t, 0.4);
          return;
        }
      }

      // Boats rowing in the trough.
      for (let b = 0; b < 2; b++) {
        const bx = XF + 0.02 + b * 0.16;
        const by = 0.71 + b * 0.035 + Math.sin(t * 1.3 + bx * 10) * 0.004;
        const hx = Math.abs(xs - bx);
        if (hx < 0.045 && Math.abs(ys - by) < 0.009) {
          rg = hx > 0.037 ? (xs < bx ? G_LT : G_GT) : G_EQ;
          rc = step(R_BOAT, 0.8 - hx * 8);
          return;
        }
        if (hx < 0.04 && ys > by + 0.009 && ys < by + 0.026) {
          if (Math.abs((((xs - bx) / 0.018 + 100.5) % 1) - 0.5) < 0.2) {
            rg = G_SLASH;
            rc = step(R_BOAT, 0.4);
            return;
          }
        }
      }

      // Mt. Fuji, small and calm behind the claw.
      const fd = Math.abs(xs - XF) / 0.2;
      if (fd < 1) {
        const f = Math.pow(1 - fd, 1.25);
        const topY = HORIZON - 0.14 * f;
        if (ys >= topY && ys <= HORIZON + 0.01) {
          const snowLine = HORIZON - 0.14 * 0.62 + 0.012 * Math.sin(xs * 110);
          if (ys < snowLine) {
            rg = G_CARET;
            rc = step(R_SNOW, 0.5 + 0.5 * (1 - (ys - topY) / 0.06));
          } else {
            const h1 = hash(x, y, 2);
            rg = h1 < 0.55 ? (xs < XF ? G_SLASH : G_BACK) : G_DOT;
            rc = step(R_FUJI, 0.3 + 0.5 * (1 - fd));
          }
          return;
        }
      }

      if (ys >= HORIZON) {
        // Open sea.
        const td = clamp((ys - HORIZON) / 0.45);
        const w1 = Math.sin(xs * (40 + 80 * td) + t * (0.8 + 0.8 * td) + Math.sin(ys * 60 + t * 0.3) * 1.4);
        const w2 = Math.sin(xs * 23 - t * 0.55 + ys * 35);
        const v = 0.5 + 0.25 * w1 + 0.25 * w2;
        if (v > 0.52 - 0.1 * td) {
          rg = v > 0.9 ? G_TILDE : v > 0.78 ? G_EQ : v > 0.66 ? G_DASH : G_DOT;
          rc = v > 0.9 ? step(R_FOAM, 0.2 + td * 0.4) : step(td < 0.25 ? R_SEA_FAR : R_SEA, v * 0.8 + td * 0.3);
        }
        return;
      }

      // Sky: a low sun, drifting cloud strokes and a few stars.
      const ds = Math.hypot(xs - SUN.x, ys - SUN.y);
      const cl = Math.sin(xs * 4.5 + t * 0.04 + Math.sin(ys * 16 + t * 0.05) * 2.2) * Math.sin(ys * 34 + xs * 1.5);
      if (ds < SUN.r && cl < 0.62) {
        const k = ds / SUN.r;
        rg = SUN_GLYPHS[Math.min(4, Math.floor((1 - k) * 5))];
        rc = step(R_SUN, 1 - k * 0.9);
      } else if (cl > 0.55) {
        rg = cl > 0.8 ? G_EQ : G_DASH;
        rc = step(R_CLOUD, (cl - 0.55) * 2.2);
      } else if (ds < SUN.r * 1.8 && hash(x, y, Math.floor(t * 2)) < 0.16 * (1 - (ds - SUN.r) / (SUN.r * 0.8))) {
        rg = G_DOT;
        rc = step(R_SUN, 0.35);
      } else {
        const h1 = hash(x, y, 0);
        if (h1 < 0.004) {
          rg = G_DOT;
          rc = step(R_STAR, 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2 + h1 * 9000)));
        }
      }
    };

    const buildAtlas = () => {
      const a = document.createElement("canvas");
      a.width = GL.length * cw * dpr;
      a.height = COLORS.length * ch * dpr;
      const c = a.getContext("2d");
      if (!c) return;
      c.scale(dpr, dpr);
      c.font = `500 ${fontSize}px ${family}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      COLORS.forEach((col, ci) => {
        c.fillStyle = col;
        for (let i = 1; i < GL.length; i++) c.fillText(GL[i], i * cw + cw / 2, ci * ch + ch / 2 + 1);
      });
      atlas = a;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fontSize = W < 640 ? 10 : W > 2200 ? 16 : 12;
      ctx.font = `500 ${fontSize}px ${family}`;
      cw = Math.max(5, Math.round(ctx.measureText("M").width));
      ch = Math.round(fontSize * 1.4);
      cols = Math.ceil(W / cw);
      rows = Math.ceil(H / ch);
      buildAtlas();
    };

    const frame = (now: number) => {
      if (disposed || !atlas) return;
      const t = reduced ? INTRO + 4 : (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);

      // Fit the scene: wide screens zoom in, narrow ones crop around the wave.
      const aspect = W / H;
      const S = clamp(aspect / 1.4, 0.62, 1.1);
      pointer.sx += (((pointer.x / W - 0.5) * 0.04 || 0) - pointer.sx) * 0.05;
      const sweep = clamp(t / INTRO) * 1.3;
      const tick = Math.floor(t * 14);
      const aw = cw * dpr;
      const ah = ch * dpr;
      const live = ripples.filter((r) => t - r.t0 < 2.2);
      ripples.length = 0;
      ripples.push(...live);
      const px = pointer.x / cw;
      const py = pointer.y / ch;
      const ratio = ch / cw;

      for (let y = 0; y < rows; y++) {
        const ys = ((y + 0.5) * ch / H - 0.5) / S + 0.46;
        for (let x = 0; x < cols; x++) {
          const nx = x / cols;
          if (nx > sweep) continue;
          if (sweep - nx < 0.07 && t < INTRO + 0.4) {
            rg = SCRAMBLE[Math.floor(hash(x, y, tick) * SCRAMBLE.length)];
            rc = step(R_FOAM, 1);
          } else {
            const xs = ((x + 0.5) * cw / H - aspect / 2 - pointer.sx) / S + 0.62;
            resolve(x, y, xs, ys, t);
          }

          for (const rp of ripples) {
            const age = t - rp.t0;
            const dd = Math.hypot(x - rp.x, (y - rp.y) * ratio);
            if (Math.abs(dd - age * 22) < 1.4) {
              rg = G_O;
              rc = step(R_FOAM, 1 - age / 2.2);
            }
          }

          if (pointer.active) {
            const dd = Math.hypot(x - px, (y - py) * ratio);
            if (dd < 16) {
              const k = 1 - dd / 16;
              if (rg) rc = step(R_GLOW, k * 1.2);
              else if (hash(x, y, tick) < 0.25 * k * k) {
                rg = G_DOT;
                rc = step(R_GLOW, k);
              }
            }
          }

          if (rg) ctx.drawImage(atlas, rg * aw, rc * ah, aw, ah, x * cw, y * ch, cw, ch);
        }
      }

      // Sakura petals crossing the print, top right to bottom left.
      if (t > INTRO) {
        for (let i = 0; i < 26; i++) {
          const h1 = hash(i, 1, 1);
          const h2 = hash(i, 2, 2);
          const h3 = hash(i, 3, 3);
          const life = (t * (0.025 + 0.025 * h1) + h2) % 1;
          const x = Math.round(cols * (1.1 - 1.2 * life) + Math.sin(life * 9 + h3 * 6) * 3);
          const y = Math.round(rows * life * 0.95 + Math.sin(life * 14 + h3 * 9) * 2);
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          const gi = i % 4 === 0 ? G_STAR : PETALS[i % PETALS.length];
          ctx.drawImage(atlas, gi * aw, step(R_PETAL, h3) * ah, aw, ah, x * cw, y * ch, cw, ch);
        }
      }

      if (!reduced) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onDown = (e: PointerEvent) => {
      onMove(e);
      ripples.push({ x: pointer.x / cw, y: pointer.y / ch, t0: (performance.now() - start) / 1000 });
      if (ripples.length > 5) ripples.shift();
    };

    const init = () => {
      if (disposed) return;
      family =
        getComputedStyle(canvas).getPropertyValue("--font-geist-mono").trim() || "monospace";
      resize();
      raf = requestAnimationFrame(frame);
    };
    document.fonts.ready.then(init);

    const ro = new ResizeObserver(() => {
      if (!atlas) return;
      resize();
      if (reduced) frame(performance.now());
    });
    ro.observe(canvas);
    canvas.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="The Great Wave off Kanagawa, drawn in animated ASCII"
      role="img"
      className="absolute inset-0 h-full w-full touch-none"
    />
  );
}
