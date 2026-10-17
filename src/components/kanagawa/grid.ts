/**
 * Shared by the WebGL renderer and the static 2D fallback: the Kanagawa palette,
 * the glyph set, and the step that samples the print into a grid of glyph cells.
 *
 * Each cell is a {BX}x{BY} patch of pixels. Flat patches get a density glyph
 * (jittered so it never bands); detailed ones get the glyph whose strokes best
 * match the patch. Colours snap to the nearest Kanagawa palette entry.
 */

export const SRC = "/kanagawa/great-wave.webp";
export const BX = 4; // sample bins per cell, horizontally
export const BY = 8; // ... and vertically
export const NB = BX * BY;
export const LEVELS = 6;

// Kanagawa (wave) palette, as used by kanagawa.nvim.
const BG = [0x1f, 0x1f, 0x28];
export const BASE = [
  "#dcd7ba", // fujiWhite
  "#c8c093", // oldWhite
  "#a3d4d5", // lightBlue
  "#7fb4ca", // springBlue
  "#7e9cd8", // crystalBlue
  "#9cabca", // springViolet2
  "#938aa9", // springViolet1
  "#957fb8", // oniViolet
  "#658594", // dragonBlue
  "#6a9589", // waveAqua1
  "#2d4f67", // waveBlue2
  "#223249", // waveBlue1
  "#e6c384", // carpYellow
  "#c0a36e", // boatYellow
  "#d27e99", // sakuraPink
  "#e46876", // waveRed
  "#c34043", // autumnRed
  "#98bb6c", // springGreen
  "#717c7c", // katanaGray
  "#54546d", // sumiInk6
];
export const H_CARP = BASE.indexOf("#e6c384");
export const H_FOAM = BASE.indexOf("#dcd7ba");

// No bare horizontal bars (- _ =): matched row after row they read as scanlines.
export const GLYPHS =
  " .'`:;+*!|/\\()<>[]{}ilIrtcxzvunoeaswmOZ0&%#8$@BWMXKNH?7";
const gl = (c: string) => GLYPHS.indexOf(c);
// Glyphs without a strong stroke direction: used for flat tones, ordered by ink.
const RAMP_SET = Array.from(".'`:;,+*xozvc?rsea%&#8$@XKNMWB", gl);
export const SPARK = Array.from("*+`'", gl);
export const SCRAMBLE_FROM = 12; // glyphs from here on are the busy ones

const rgbOf = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

function toLab(r: number, g: number, b: number): [number, number, number] {
  const f = (c: number) => {
    c /= 255;
    return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  };
  const R = f(r);
  const G = f(g);
  const B = f(b);
  const q = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = q((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
  const y = q(0.2126 * R + 0.7152 * G + 0.0722 * B);
  const z = q((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

// Palette: every base colour at LEVELS brightnesses, blended towards the background.
export const PAL_RGB: number[] = [];
const PAL_LAB: [number, number, number][] = [];
BASE.forEach((hex) => {
  const c = rgbOf(hex);
  for (let l = 0; l < LEVELS; l++) {
    const f = 0.55 + (0.55 * l) / (LEVELS - 1);
    const m = c.map((v, i) => Math.min(255, Math.round(v * f + BG[i] * Math.max(0, 1 - f))));
    PAL_RGB.push(m[0], m[1], m[2]);
    PAL_LAB.push(toLab(m[0], m[1], m[2]));
  }
});

export function clamp(v: number, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, v));
}

function smooth(a: number, b: number, v: number) {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Separable box blur, used for a local-contrast (unsharp mask) pass. */
function boxBlur(src: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const n = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / n;
      acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / n;
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}

export function hash(x: number, y: number, k: number) {
  const r = Math.sin((x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453);
  return r - Math.floor(r);
}

export const NG = GLYPHS.length;
export const NC = PAL_RGB.length / 3;
export const PAL_CSS = Array.from({ length: NC }, (_, i) => `rgb(${PAL_RGB[i * 3]}, ${PAL_RGB[i * 3 + 1]}, ${PAL_RGB[i * 3 + 2]})`);

/** Ink pattern of every glyph, as a BXxBY grid of coverage values. */
    /** Ink pattern of every glyph, as a BXxBY grid of coverage values. */
function glyphShapes(cw: number, ch: number, fontSize: number, family: string) {
  const k = 4;
  const c = document.createElement("canvas");
  c.width = cw * k;
  c.height = ch * k;
  const g = c.getContext("2d", { willReadFrequently: true });
  const out = new Float32Array(NG * NB);
  if (!g) return out;
  g.font = `600 ${fontSize * k}px ${family}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const bw = (cw * k) / BX;
  const bh = (ch * k) / BY;
  for (let i = 1; i < NG; i++) {
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = "#fff";
    g.fillText(GLYPHS[i], c.width / 2, c.height / 2 + k);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    for (let by = 0; by < BY; by++) {
      for (let bx = 0; bx < BX; bx++) {
        let s = 0;
        for (let y = 0; y < bh; y++) {
          for (let x = 0; x < bw; x++) s += d[((by * bh + y) * c.width + bx * bw + x) * 4 + 3];
        }
        out[i * NB + by * BX + bx] = s / (bw * bh * 255);
      }
    }
  }
  return out;
}

export type Grid = {
  cw: number; // cell size in device pixels
  ch: number;
  fontSize: number;
  vc: number; // visible size, in cells
  vr: number;
  gc: number; // whole picture, in cells
  gr: number;
  /** 4 bytes per cell: glyph, hue, level, 100 + kind (0 paper, 1 water, 2 foam). */
  cells: Uint8Array;
};

/** Sample the print into the glyph grid for a canvas of Wd x Hd device pixels. */
export function sampleGrid(img: HTMLImageElement, Wd: number, Hd: number, family: string): Grid | null {
  const cw = clamp(Math.ceil(Wd / 360), 4, 14);
  const ch = cw * 2;
  const fontSize = cw / 0.58;
  const vc = Math.ceil(Wd / cw);
  const vr = Math.ceil(Hd / ch);
  // A little oversize, so the camera has room to pan and to clear the wiki panel.
  const scale = Math.max(Wd / img.naturalWidth, Hd / img.naturalHeight) * 1.14;
  const gc = Math.max(vc, Math.ceil((img.naturalWidth * scale) / cw));
  const gr = Math.max(vr, Math.ceil((img.naturalHeight * scale) / ch));

  const shapes = glyphShapes(cw, ch, fontSize, family);
  let dmax = 0;
  const g2 = new Float32Array(NG);
  const avg = new Float32Array(NG);
  for (let j = 0; j < NG; j++) {
    let sum = 0;
    for (let i = 0; i < NB; i++) {
      const v = shapes[j * NB + i];
      sum += v;
      g2[j] += v * v;
    }
    avg[j] = sum / NB;
    dmax = Math.max(dmax, avg[j]);
  }
  const tScale = Math.min(1, dmax * 1.15);
  const ramp = RAMP_SET.map((j) => ({ j, c: avg[j] })).sort((a, b) => a.c - b.c);

  const off = document.createElement("canvas");
  off.width = gc * BX;
  off.height = gr * BY;
  const o = off.getContext("2d", { willReadFrequently: true });
  if (!o) return null;
  o.imageSmoothingQuality = "high";
  o.drawImage(img, 0, 0, off.width, off.height);
  const px = o.getImageData(0, 0, off.width, off.height).data;

  const pw = off.width;
  const lumAll = new Float32Array(pw * off.height);
  for (let i = 0; i < lumAll.length; i++) {
    lumAll[i] = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255;
  }
  const blurred = boxBlur(lumAll, pw, off.height, 6);

  const cells = new Uint8Array(gc * gr * 4);
  const T = new Float32Array(NB);
  const stride = off.width * 4;

  for (let cy = 0; cy < gr; cy++) {
    for (let cx = 0; cx < gc; cx++) {
      const i = (cy * gc + cx) * 4;
      cells[i + 3] = 100;
      let sv = 0;
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let sl = 0;
      let mv = 0;
      for (let by = 0; by < BY; by++) {
        for (let bx = 0; bx < BX; bx++) {
          const p = (cy * BY + by) * stride + (cx * BX + bx) * 4;
          const r = px[p] / 255;
          const g = px[p + 1] / 255;
          const b = px[p + 2] / 255;
          const li = (cy * BY + by) * pw + cx * BX + bx;
          const lum = clamp(lumAll[li] + 1.1 * (lumAll[li] - blurred[li]));
          // Lift the darks so the indigo stays visible on a dark page, and
          // quieten the cream paper so the wave and foam carry the picture.
          const warm = r - b;
          const paper = smooth(0.05, 0.15, warm);
          const v = (0.08 + 0.92 * Math.pow(lum, 2.4)) * (1 - 0.7 * paper);
          T[by * BX + bx] = v * tScale;
          sv += v;
          sr += v * r;
          sg += v * g;
          sb += v * b;
          sl += lum;
          if (v > mv) mv = v;
        }
      }
      if (sv / NB < 0.06) continue;

      const mean = (sv / NB) * tScale;
      let spread = 0;
      for (let k = 0; k < NB; k++) spread += Math.abs(T[k] - mean);
      spread /= NB;

      let best = 0;
      let bestScore = Infinity;
      if (spread < 0.08) {
        // Flat tone: pick from the isotropic ramp, jittered so it never bands.
        const want = mean + (hash(cx, cy, 4) - 0.5) * 0.12;
        for (const r of ramp) {
          const d = Math.abs(r.c - want);
          if (d < bestScore) {
            bestScore = d;
            best = r.j;
          }
        }
      } else {
        // Detail (outlines, foam edges): match the actual stroke shape.
        const dither = (hash(cx, cy, 1) - 0.5) * 0.05;
        for (let k = 0; k < NB; k++) T[k] = clamp(T[k] + dither * (0.5 + hash(cx * 7 + k, cy, 2)));
        for (let j = 1; j < NG; j++) {
          let dot = 0;
          const base = j * NB;
          for (let k = 0; k < NB; k++) dot += shapes[base + k] * T[k];
          const score = g2[j] - 2 * dot;
          if (score < bestScore) {
            bestScore = score;
            best = j;
          }
        }
      }
      cells[i] = best;

      // Colour: keep the cell's hue, normalise its brightness, then snap to Kanagawa.
      const m = Math.max(sr, sg, sb) || 1;
      const bf = 0.85 + 0.15 * clamp(mv);
      const nr = sr / m;
      const ng = sg / m;
      const nb = sb / m;
      const gray = (nr + ng + nb) / 3;
      // Push saturation so snapping to the palette keeps the indigo / cream split.
      const sat = (c: number) => clamp(gray + (c - gray) * 1.8) * bf * 255;
      const L = toLab(sat(nr), sat(ng), sat(nb));
      let pi = 0;
      let pd = Infinity;
      for (let k = 0; k < PAL_LAB.length; k++) {
        const d = (L[0] - PAL_LAB[k][0]) ** 2 + (L[1] - PAL_LAB[k][1]) ** 2 + (L[2] - PAL_LAB[k][2]) ** 2;
        if (d < pd) {
          pd = d;
          pi = k;
        }
      }
      cells[i + 1] = Math.floor(pi / LEVELS);
      cells[i + 2] = pi % LEVELS;
      const warmCell = sr / sv - sb / sv > 0.06;
      cells[i + 3] = 100 + (warmCell ? 0 : sl / NB > 0.62 ? 2 : 1);
    }
  }

  return { cw, ch, fontSize, vc, vr, gc, gr, cells };
}

/** Draw one still frame of the grid (no animation): the fallback when WebGL is unavailable. */
export function drawStatic(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  vx: number,
  vy: number,
  family: string,
) {
  const { cw, ch, fontSize, vc, vr, gc, cells } = grid;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.font = `600 ${fontSize}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Group by colour so the fill style changes once per palette entry.
  const buckets: number[][] = Array.from({ length: NC }, () => []);
  for (let y = 0; y < vr; y++) {
    for (let x = 0; x < vc; x++) {
      const i = ((y + vy) * gc + (x + vx)) * 4;
      if (!cells[i]) continue;
      buckets[cells[i + 1] * LEVELS + cells[i + 2]].push(x, y, cells[i]);
    }
  }
  buckets.forEach((b, ci) => {
    if (!b.length) return;
    ctx.fillStyle = PAL_CSS[ci];
    for (let k = 0; k < b.length; k += 3) ctx.fillText(GLYPHS[b[k + 2]], b[k] * cw + cw / 2, b[k + 1] * ch + ch / 2 + 1);
  });
}
