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
const BLEND_RADIUS = 170;

const TAGLINE = "SOFTWARE ENGINEER & FOUNDER";
const SUBLINE = "QA ENGINEER AT NOSCAI. FOUNDER OF SHIRO LABS.";

// Timeline (seconds)
//   Phase 1: the field renders left to right behind a scramble slab.
//   Phase 2: name, role and contact links decode out of scrambled ASCII.
//   Phase 3: idle; hover blend, clicks and ripples are live.
const SLAB_WIDTH = 0.12; // width of the scramble slab, as a fraction of the grid
const P1_END = 2.4;
const P2_START = P1_END;
const P2_END = 4.2;
const SCRAMBLE_LIFE = 0.85; // how long a cell stays scrambled before it settles
const RIPPLE_LIFE = 2.2;
const RIPPLE_SPEED = 640; // px / s
export const ASCII_INTRO_DURATION = P2_END;

type Link = { label: string; href: string };
type Kind = 0 | 1 | 2; // name | body | link
type TextCell = { x: number; y: number; ch: string; kind: Kind; link: number };
type Ripple = { x: number; y: number; t0: number };
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
    let cw = 8;
    let ch = 16;
    let fontSize = 12;
    let family = "monospace";
    let mask = new Float32Array(0);
    let halo = new Float32Array(0);
    let textCells: TextCell[] = [];
    let hits: Hit[] = [];
    let live = false; // phase 3: interaction enabled
    const ripples: Ripple[] = [];
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
      size = Math.min(size, Math.floor((rows * 0.34) / (nameLines.length * 0.5)));
      const pitch = size * 0.5 * 0.95;
      const nameRows = pitch * nameLines.length;

      // Vertical stack: name, tagline, subline, contact row.
      const total = nameRows + 9;
      const top = Math.max(2, (rows - total) / 2 - 1);
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
      buildLayout();
    };

    const rippleAt = (px: number, py: number, t: number) => {
      let sum = 0;
      for (const r of ripples) {
        const age = t - r.t0;
        if (age < 0 || age > RIPPLE_LIFE) continue;
        const d = Math.hypot(px - r.x, py - r.y);
        const edge = (d - age * RIPPLE_SPEED) / 80;
        sum += Math.exp(-edge * edge) * (1 - age / RIPPLE_LIFE);
      }
      return sum;
    };

    const fieldValue = (x: number, y: number, t: number, gain: number) => {
      let v =
        0.5 +
        0.25 * Math.sin(x * 0.09 + t * 0.7 + Math.sin(y * 0.12 - t * 0.45) * 1.6) +
        0.25 * Math.sin(y * 0.16 + x * 0.04 - t * 0.55);
      if (live) {
        if (pointer.active) {
          const dx = x * cw - pointer.x;
          const dy = y * ch - pointer.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 220) {
            const fall = 1 - d / 220;
            v += fall * fall * (0.55 + 0.25 * Math.sin(d * 0.08 - t * 7));
          }
        }
        v += rippleAt(x * cw, y * ch, t) * 1.3;
      }
      return clamp(v * gain * 2);
    };

    const hitAt = (px: number, py: number) =>
      hits.find((h) => px >= h.x0 && px <= h.x1 && py >= h.y0 && py <= h.y1);

    const frame = (now: number) => {
      if (disposed) return;
      const t = reduced ? ASCII_INTRO_DURATION + 1 : (now - start) / 1000;
      live = t >= P2_END;
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (t - ripples[i].t0 > RIPPLE_LIFE) ripples.splice(i, 1);
      }
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${fontSize}px ${family}`;
      ctx.textBaseline = "top";

      const sweep = clamp(t / P1_END) * 1.25;
      const decode = smooth(P2_START, P2_START + 0.8, t);
      const settled = smooth(P2_START, P2_END, t);
      const baseGain = 0.5 - 0.1 * settled;
      const tick = Math.floor(t * 14);
      const hover = live && pointer.active ? hitAt(pointer.x, pointer.y) : undefined;
      canvas.style.cursor = hover ? "pointer" : "";

      const lines: string[][] = TIERS.map(() => new Array<string>(rows));
      const rowBuf: string[][] = TIERS.map(() => new Array<string>(cols));
      const blendAt = (x: number, y: number) => {
        if (!live) return 0;
        let b = 0;
        if (pointer.active) {
          const dx = (x + 0.5) * cw - pointer.x;
          const dy = (y + 0.5) * ch - pointer.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < BLEND_RADIUS) b = Math.pow(1 - d / BLEND_RADIUS, 1.4);
        }
        // Click ripples dissolve the text as the wave passes over it.
        const wave = rippleAt((x + 0.5) * cw, (y + 0.5) * ch, t);
        return Math.min(1, Math.max(b, wave * 0.9));
      };

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
            // The field fades out behind text only once it starts decoding.
            const gain = baseGain * (1 - halo[y * cols + x] * decode);
            const idx = Math.floor(fieldValue(x, y, t, gain) * (RAMP.length - 1));
            glyph = RAMP[idx];
            tier = idx < 3 ? 0 : idx < 5 ? 1 : idx < 7 ? 2 : 3;
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
        const b = blendAt(x, y) * (isHover ? 0.25 : 1);
        if (b > 0 && hash(x, y, tick) < b * 0.9) {
          const idx = Math.max(1, Math.floor(fieldValue(x, y, t, 0.5) * (RAMP.length - 1)));
          glyph = RAMP[idx];
        }
        const step = scrambling ? 3 : Math.round(b * STEPS);
        ctx.fillStyle = isHover ? hoverColors[step] : colors[kind][step];
        ctx.fillText(glyph, x * cw, y * ch);
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
        ctx.fillText(`${label} ${String(pct).padStart(3, "0")}%`, 20, h - 36);
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
    const onClick = (e: MouseEvent) => {
      if (!live) return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (ripples.length >= 4) ripples.shift();
      ripples.push({ x, y, t0: (performance.now() - start) / 1000 });
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
    canvas.addEventListener("click", onClick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [links]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}
