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

// Foreground text stays in the same blue family as the field; blending lerps
// these towards BLEND_TO. The halo keeps the field quiet behind the text.
const NAME_RGBA = [214, 226, 255, 0.97];
const BODY_RGBA = [150, 180, 240, 0.9];
const LINK_RGBA = [120, 160, 245, 0.95];
const HOVER_RGBA = [255, 255, 255, 1];
const BLEND_TO = [96, 140, 235, 0.55];
const STEPS = 8;

const TAGLINE = "SOFTWARE ENGINEER & FOUNDER";
const SUBLINE = "QA ENGINEER AT NOSCAI. FOUNDER OF SHIRO LABS.";

// Timeline (seconds)
//   Phase 1: the field renders left to right behind a scramble slab.
//   Phase 2: name, role and contact links decode out of scrambled ASCII.
//   Phase 3: idle; clicks, hover and water waves are live.
const SLAB_WIDTH = 0.12; // width of the scramble slab, as a fraction of the grid
const P1_END = 2.4;
const P2_START = P1_END;
const P2_END = 4.2;
const SCRAMBLE_LIFE = 0.85; // how long a cell stays scrambled before it settles

// Water: a height-field wave simulation stepped at a fixed rate.
const WATER_STEP = 1 / 120;
const WATER_K = 0.28; // wave stiffness (wave speed ~ 400px/s)
const WATER_DAMP = 0.9962; // per step; ripples fade over ~2s

// Beach: the canvas runs past the fold of the hero (EXTEND x the fold height)
// so nothing is ever clipped. The waterline swings between REST and CREST
// (fractions of the fold height): the sea rushes down over the empty sand,
// then drains back, and the sand dissolves into nothing well before the edge.
const EXTEND = 1.55; // canvas height as a multiple of the fold
const REST = 0.82; // waterline at low tide
const CREST = 1.25; // waterline at high tide
const TIDE_PERIOD = 12; // seconds per wave cycle
const TIDE_RUSH = 3.2; // sea running up the sand
const TIDE_HOLD = 1.1; // sea at its highest
const TIDE_DRAIN = 5.2; // sea draining back
export const ASCII_INTRO_DURATION = P2_END;

type Link = { label: string; href: string };
type Kind = 0 | 1 | 2; // name | body | link
type TextCell = { x: number; y: number; ch: string; kind: Kind; link: number };
type Hit = { x0: number; x1: number; y0: number; y1: number; link: number };

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

function lerpColor(from: number[], to: number[], t: number) {
  const c = (i: number) => Math.round(from[i] + (to[i] - from[i]) * t);
  const a = from[3] + (to[3] - from[3]) * t;
  return `rgba(${c(0)}, ${c(1)}, ${c(2)}, ${a.toFixed(2)})`;
}

function palette(base: number[]) {
  return Array.from({ length: STEPS + 1 }, (_, i) => lerpColor(base, BLEND_TO, i / STEPS));
}

/**
 * Fullscreen animated ASCII hero: a flowing glyph field with an Aino-style
 * loading intro. The name, role and contact links stay ASCII permanently and
 * dissolve into the field around the pointer.
 */
export default function AsciiIntro({ links }: { links: Link[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -9999, y: -9999, active: false };
    const colors = [palette(NAME_RGBA), palette(BODY_RGBA), palette(LINK_RGBA)];
    const hoverColors = palette(HOVER_RGBA);
    let cols = 0;
    let rows = 0;
    let foldRows = 0; // rows down to the fold of the hero
    let foldH = 0; // px down to the fold
    let cw = 8;
    let ch = 16;
    let fontSize = 12;
    let family = "monospace";
    let mask = new Float32Array(0);
    let halo = new Float32Array(0);
    let textCells: TextCell[] = [];
    let hits: Hit[] = [];
    let live = false; // phase 3: interaction enabled
    let water = new Float32Array(0); // surface height per cell
    let vel = new Float32Array(0);
    let wx = 0.85; // horizontal / vertical neighbour weights (cells are ~1:2.4)
    let wy = 0.15;
    let acc = 0;
    let lastNow = -1;
    let nextDrop = 0;
    const lastPtr = { x: 0, y: 0, set: false };
    let shoreCol = new Float32Array(0); // waterline per column (rows)
    let wetCol = new Float32Array(0); // furthest the sea reached, drying out
    let activeCol = new Float32Array(0); // 1 while the edge is moving
    let beachDamp = new Float32Array(0);
    let ox = 0; // scratch: float offset of the text cell being drawn
    let oy = 0;
    let os = 0;
    let raf = 0;
    let disposed = false;
    const start = performance.now();

    const buildLayout = () => {
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const o = off.getContext("2d");
      if (!o) return;
      o.clearRect(0, 0, cols, rows);
      o.fillStyle = "#fff";
      o.textAlign = "center";
      o.textBaseline = "middle";

      // Name: big filled glyph mask. Cells are ~1:2, so squash vertically.
      const nameLines = ["AFTAR", "FADILAH"];
      const longest = Math.max(...nameLines.map((l) => l.length));
      let size = Math.floor((cols * 0.86) / (longest * 0.72));
      size = Math.min(size, Math.floor((foldRows * 0.34) / (nameLines.length * 0.5)));
      const pitch = size * 0.5 * 0.95;
      const nameRows = pitch * nameLines.length;

      // Vertical stack: name, tagline, subline, contact row.
      const total = nameRows + 9;
      const top = Math.max(2, (foldRows - total) / 2 - 1);
      o.font = `800 ${size}px sans-serif`;
      nameLines.forEach((line, i) => {
        o.save();
        o.translate(cols / 2, top + pitch * (i + 0.5));
        o.scale(1, 0.5);
        o.fillText(line, 0, 0);
        o.restore();
      });
      const data = o.getImageData(0, 0, cols, rows).data;
      mask = new Float32Array(cols * rows);
      for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] / 255;

      // Small copy is placed one real character per cell so it stays legible.
      textCells = [];
      hits = [];
      const place = (text: string, row: number, kind: Kind, startCol: number, link = -1) => {
        for (let i = 0; i < text.length; i++) {
          if (text[i] === " ") continue;
          textCells.push({ x: startCol + i, y: row, ch: text[i], kind, link });
        }
      };
      const centered = (text: string) => Math.max(0, Math.round((cols - text.length) / 2));
      const tagRow = Math.round(top + nameRows + 2);
      const subRow = tagRow + 2;
      const contactRow = subRow + 4;
      place(TAGLINE, tagRow, 1, centered(TAGLINE));
      place(SUBLINE, subRow, 1, centered(SUBLINE));

      const labels = links.map((l) => `[ ${l.label.toUpperCase()} ]`);
      const gap = 3;
      const rowLen = labels.reduce((n, l) => n + l.length, 0) + gap * (labels.length - 1);
      let c = centered(" ".repeat(rowLen));
      labels.forEach((label, i) => {
        place(label, contactRow, 2, c, i);
        hits.push({
          x0: (c - 1) * cw,
          x1: (c + label.length + 1) * cw,
          y0: (contactRow - 0.5) * ch,
          y1: (contactRow + 1.5) * ch,
          link: i,
        });
        c += label.length + gap;
      });

      // Halo: keep the field quiet around any text so colours never mix.
      halo = new Float32Array(cols * rows);
      const mark = (cx: number, cy: number, rx: number, ry: number) => {
        for (let dy = -ry; dy <= ry; dy++) {
          for (let dx = -rx; dx <= rx; dx++) {
            const x = cx + dx;
            const y = cy + dy;
            if (x >= 0 && y >= 0 && x < cols && y < rows) halo[y * cols + x] = 1;
          }
        }
      };
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) if (mask[y * cols + x] > 0.35) mark(x, y, 2, 1);
      }
      for (const t of textCells) mark(t.x, t.y, 1, 0);
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
      foldH = h / EXTEND;
      foldRows = Math.ceil(foldH / ch) + 1;
      buildLayout();
      water = new Float32Array(cols * rows);
      vel = new Float32Array(cols * rows);
      const ix = 1 / (cw * cw);
      const iy = 1 / (ch * ch);
      wx = ix / (ix + iy);
      wy = iy / (ix + iy);
      // Sponge near the beach so ripples die out instead of reflecting.
      shoreCol = new Float32Array(cols).fill(foldRows * REST);
      wetCol = new Float32Array(cols).fill(foldRows * REST);
      activeCol = new Float32Array(cols);
      beachDamp = new Float32Array(rows);
      for (let y = 0; y < rows; y++) beachDamp[y] = 1 - 0.05 * smooth(foldRows * 1.1, rows, y);
    };

    const swell = (x: number, y: number, t: number) =>
      0.5 +
      0.25 * Math.sin(x * 0.09 + t * 0.7 + Math.sin(y * 0.12 - t * 0.45) * 1.6) +
      0.25 * Math.sin(y * 0.16 + x * 0.04 - t * 0.55);

    /** Push the water surface down around a point (a drop or a finger). */
    const splash = (px: number, py: number, amp: number, radius: number) => {
      const x0 = Math.max(0, Math.floor((px - radius * 2) / cw));
      const x1 = Math.min(cols - 1, Math.ceil((px + radius * 2) / cw));
      const y0 = Math.max(0, Math.floor((py - radius * 2) / ch));
      const y1 = Math.min(rows - 1, Math.ceil((py + radius * 2) / ch));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const dx = (x + 0.5) * cw - px;
          const dy = (y + 0.5) * ch - py;
          const i = y * cols + x;
          water[i] = Math.max(-3, Math.min(3, water[i] - amp * Math.exp(-(dx * dx + dy * dy) / (radius * radius))));
        }
      }
    };

    const stepWater = () => {
      for (let y = 0; y < rows; y++) {
        const damp = WATER_DAMP * beachDamp[y];
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const c = water[i];
          const l = water[x > 0 ? i - 1 : i];
          const r = water[x < cols - 1 ? i + 1 : i];
          const u = water[y > 0 ? i - cols : i];
          const d = water[y < rows - 1 ? i + cols : i];
          const lap = wx * (l + r - 2 * c) + wy * (u + d - 2 * c);
          vel[i] = (vel[i] + WATER_K * lap) * damp;
        }
      }
      for (let y = 0; y < rows; y++) {
        const keep = 1 - (1 - beachDamp[y]) * 0.25;
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          water[i] = (water[i] + vel[i]) * keep;
        }
      }
    };

    /** Sea level 0..1 (0 = resting waterline, 1 = covers the whole beach). */
    const tideLevel = (tt: number) => {
      if (tt < 0) return { lv: 0, moving: 0 };
      const c = tt % TIDE_PERIOD;
      if (c < TIDE_RUSH) {
        const u = c / TIDE_RUSH;
        return { lv: 1 - Math.pow(1 - u, 2.4), moving: 1 };
      }
      if (c < TIDE_RUSH + TIDE_HOLD) return { lv: 1, moving: 0.35 };
      if (c < TIDE_RUSH + TIDE_HOLD + TIDE_DRAIN) {
        const u = (c - TIDE_RUSH - TIDE_HOLD) / TIDE_DRAIN;
        return { lv: 1 - smooth(0, 1, u), moving: 0.8 };
      }
      return { lv: 0, moving: 0 };
    };

    const updateTide = (t: number, dt: number) => {
      const rest = foldRows * REST;
      const peak = foldRows * CREST;
      for (let x = 0; x < cols; x++) {
        // The wave arrives a touch earlier in some places so the front is slanted.
        const lag = 0.55 * (0.5 + 0.5 * Math.sin(x * 0.011 + 0.6)) + 0.18 * Math.sin(x * 0.043);
        const { lv, moving } = tideLevel(t - P2_END - lag);
        const jag = (0.5 + 0.9 * moving) * Math.sin(x * 0.07 + t * 1.3) + 0.4 * Math.sin(x * 0.19 - t * 2);
        const w = rest + (peak - rest) * lv + jag * (lv > 0.01 ? 1 : 0.3);
        shoreCol[x] = w;
        activeCol[x] = moving;
        wetCol[x] = Math.max(w, wetCol[x] - 0.55 * dt);
      }
    };

    /** How the water moves a floating glyph: bob with height, slide downhill. */
    const floatAt = (x: number, y: number, t: number) => {
      const i = y * cols + x;
      const hv = water[i];
      const gx = (water[x < cols - 1 ? i + 1 : i] - water[x > 0 ? i - 1 : i]) * 0.5;
      const gy = (water[y < rows - 1 ? i + cols : i] - water[y > 0 ? i - cols : i]) * 0.5;
      ox = clamp(-gx * cw * 3, -2 * cw, 2 * cw) + Math.sin(y * 0.3 + t * 1.1) * cw * 0.15;
      oy =
        clamp(-hv * ch * 0.6, -1.4 * ch, 1.4 * ch) + Math.sin(x * 0.05 + t * 1.5) * ch * 0.07;
      os = Math.hypot(gx, gy);
    };

    const hitAt = (px: number, py: number) =>
      hits.find((h) => px >= h.x0 && px <= h.x1 && py >= h.y0 && py <= h.y1);

    const frame = (now: number) => {
      if (disposed) return;
      const t = reduced ? ASCII_INTRO_DURATION + 1 : (now - start) / 1000;
      live = t >= P2_END;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${fontSize}px ${family}`;
      ctx.textBaseline = "top";

      // Water simulation (starts as phase 2 begins).
      if (!reduced && t >= P2_START) {
        if (lastNow < 0) lastNow = now;
        const dt = Math.min(0.05, (now - lastNow) / 1000);
        acc = Math.min(0.1, acc + dt);
        lastNow = now;
        updateTide(t, dt);
        while (acc >= WATER_STEP) {
          stepWater();
          acc -= WATER_STEP;
        }
        if (t > nextDrop) {
          splash(
            Math.random() * w,
            Math.random() * foldH,
            0.6 + Math.random() * 0.5,
            26 + Math.random() * 14,
          );
          nextDrop = t + 1.2 + Math.random() * 2;
        }
      }

      const sweep = clamp(t / P1_END) * 1.25;
      const decode = smooth(P2_START, P2_START + 0.8, t);
      const settled = smooth(P2_START, P2_END, t);
      const baseGain = 0.5 - 0.1 * settled;
      const tick = Math.floor(t * 14);
      const hover = live && pointer.active ? hitAt(pointer.x, pointer.y) : undefined;
      canvas.style.cursor = hover ? "pointer" : "";

      const lines: string[][] = TIERS.map(() => new Array<string>(rows));
      const rowBuf: string[][] = TIERS.map(() => new Array<string>(cols));
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const nx = x / cols;
          let tier = -1;
          let glyph = " ";

          if (nx > sweep) {
            // Not reached by the sweep yet: blank.
          } else if (sweep - nx < SLAB_WIDTH && t < P1_END + 0.3) {
            glyph = SCRAMBLE[Math.floor(hash(x, y, tick) * SCRAMBLE.length)];
            tier = 3;
          } else {
            const i = y * cols + x;
            const shore = shoreCol[x];
            if (y > shore) {
              // Sand: empty, apart from a damp sheen where the sea just was.
              const wet = wetCol[x] > y ? Math.exp(-(y - shore) / 5) : 0;
              const r = hash(x, y, 3);
              // The sand dissolves into nothing between the highest tide and the edge.
              const toEdge = 1 - smooth(foldRows * CREST + 2, rows - 2, y);
              if (r < (0.04 + 0.22 * wet) * toEdge) {
                glyph = r < 0.03 ? "." : ":";
                tier = wet > 0.5 ? 1 : 0;
              }
            } else {
              // Swell + wave height + lighting from the water slope; the
              // leading edge of the sea is bright and frothy.
              const gx = (water[x < cols - 1 ? i + 1 : i] - water[x > 0 ? i - 1 : i]) * 0.5;
              const gy = (water[y < rows - 1 ? i + cols : i] - water[y > 0 ? i - cols : i]) * 0.5;
              const quiet = 1 - 0.85 * halo[i] * decode;
              const edge = shore - y;
              const act = 0.35 + 0.65 * activeCol[x];
              const crest = 0.45 * act * Math.exp(-(edge / 1.6) * (edge / 1.6));
              const v =
                (swell(x, y, t) * baseGain * 2 + water[i] * 0.7 - (gx + gy) * 1.5 + crest) * quiet;
              const idx = Math.floor(clamp(v) * (RAMP.length - 1));
              glyph = RAMP[idx];
              tier = idx < 3 ? 0 : idx < 5 ? 1 : idx < 7 ? 2 : 3;
              const foam = edge < 3 ? act * (1 - edge / 3) : 0;
              if (foam > 0 && quiet > 0.5 && hash(x, y, tick >> 1) < foam * 0.9) {
                glyph = "*:~'"[Math.floor(hash(x, y, 9) * 4)];
                tier = 3;
              }
            }
          }

          for (let k = 0; k < TIERS.length; k++) {
            rowBuf[k][x] = k === tier && glyph !== " " ? glyph : " ";
          }
        }
        for (let k = 0; k < TIERS.length; k++) lines[k][y] = rowBuf[k].join("");
      }

      for (let k = 0; k < TIERS.length; k++) {
        ctx.fillStyle = TIERS[k];
        for (let y = 0; y < rows; y++) {
          ctx.fillText(lines[k][y], 0, y * ch);
        }
      }
      ctx.globalAlpha = 1;

      // Foreground text, drawn per cell so it can scramble in and blend out.
      const drawCell = (
        x: number,
        y: number,
        glyph: string,
        kind: Kind,
        linkIdx: number,
        scrambling: boolean,
      ) => {
        const isHover = hover !== undefined && hover.link === linkIdx && kind === 2;
        floatAt(x, y, t);
        // Crests catch the water colour a little.
        const step = scrambling ? 3 : Math.round(clamp(os * 1.4, 0, 0.5) * STEPS);
        ctx.fillStyle = isHover ? hoverColors[0] : colors[kind][step];
        ctx.fillText(glyph, x * cw + ox, y * ch + oy);
      };

      // Phase 2: every cell decodes on its own delay, sweeping left to right.
      const decodeQ = (x: number, y: number) =>
        (t - P2_START - ((x / cols) * 0.35 + hash(x, y, 7) * 0.55)) / SCRAMBLE_LIFE;
      const scrambled = (x: number, y: number) =>
        SCRAMBLE[Math.floor(hash(x, y, tick + 11) * SCRAMBLE.length)];

      if (t >= P2_START) {
        ctx.font = `800 ${fontSize}px ${family}`;
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (mask[y * cols + x] <= 0.35) continue;
            const q = decodeQ(x, y);
            if (q < 0) continue;
            if (q < 1) drawCell(x, y, scrambled(x, y), 0, -1, true);
            else drawCell(x, y, "@#%8&"[(x * 7 + y * 3 + Math.floor(t * 4)) % 5], 0, -1, false);
          }
        }

        ctx.font = `600 ${fontSize}px ${family}`;
        for (const c of textCells) {
          const q = decodeQ(c.x, c.y);
          if (q < 0) continue;
          if (q < 1) drawCell(c.x, c.y, scrambled(c.x, c.y), c.kind, c.link, true);
          else drawCell(c.x, c.y, c.ch, c.kind, c.link, false);
        }
      }

      // Loading counter.
      if (t < P2_START + 1) {
        const pct = Math.round(clamp(t / P1_END) * 100);
        const alpha = 1 - smooth(P2_START, P2_START + 1, t);
        const label = t < P2_START ? "LOADING" : "DECODING";
        ctx.font = `${fontSize + 2}px ${family}`;
        ctx.fillStyle = `rgba(214, 226, 255, ${0.9 * alpha})`;
        ctx.fillText(`${label} ${String(pct).padStart(3, "0")}%`, 20, foldH - 36);
      }

      if (!reduced) raf = requestAnimationFrame(frame);
    };

    const host = canvas.parentElement ?? canvas;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active =
        pointer.x >= 0 && pointer.y >= 0 && pointer.x <= r.width && pointer.y <= foldH;
      if (live && pointer.active && lastPtr.set) {
        const speed = Math.hypot(pointer.x - lastPtr.x, pointer.y - lastPtr.y);
        if (speed > 3) splash(pointer.x, pointer.y, clamp(speed / 60) * 0.45, 24);
      }
      lastPtr.x = pointer.x;
      lastPtr.y = pointer.y;
      lastPtr.set = pointer.active;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onClick = (e: MouseEvent) => {
      if (!live) return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (y > foldH) return;
      splash(x, y, 2.4, 52);
      const hit = hitAt(x, y);
      if (!hit) return;
      const link = links[hit.link];
      if (link.href.startsWith("mailto:")) window.location.href = link.href;
      else window.open(link.href, "_blank", "noopener,noreferrer");
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

    const ro = new ResizeObserver(() => {
      if (!cols) return;
      resize();
      if (reduced) frame(performance.now());
    });
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    host.addEventListener("click", onClick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("click", onClick);
    };
  }, [links]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 w-full"
      style={{ height: `${EXTEND * 100}%` }}
    />
  );
}
