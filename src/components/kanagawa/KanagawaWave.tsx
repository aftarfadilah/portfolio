"use client";

import { useEffect, useRef } from "react";
import type { Hotspot } from "@/data/kanagawa-wiki";

/**
 * The Great Wave off Kanagawa as dense, coloured, animated ASCII.
 *
 * The print is sampled into a fine glyph grid. Each cell is a 4x8 patch of
 * pixels; the glyph whose ink pattern best matches that patch is chosen
 * (shape matching, not just a brightness ramp), and the cell is coloured with
 * the nearest colour of the Kanagawa palette. At runtime the grid is drawn
 * from a pre-rendered glyph atlas while the water flows, the foam glitters,
 * the pointer acts as a magnifying lantern and clicks send ripples.
 */

const SRC = "/kanagawa/great-wave.webp";
const BX = 4; // sample bins per cell, horizontally
const BY = 8; // ... and vertically
const NB = BX * BY;
const LEVELS = 6;

// Kanagawa (wave) palette, as used by kanagawa.nvim.
const BG = [0x1f, 0x1f, 0x28];
const BASE = [
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
const H_CARP = BASE.indexOf("#e6c384");
const H_FOAM = BASE.indexOf("#dcd7ba");

// No bare horizontal bars (- _ =): matched row after row they read as scanlines.
const GLYPHS =
  " .'`:;+*!|/\\()<>[]{}ilIrtcxzvunoeaswmOZ0&%#8$@BWMXKNH?7";
const gl = (c: string) => GLYPHS.indexOf(c);
// Glyphs without a strong stroke direction: used for flat tones, ordered by ink.
const RAMP_SET = Array.from(".'`:;,+*xozvc?rsea%&#8$@XKNMWB", gl);
const SPARK = Array.from("*+`'", gl);
const SCRAMBLE_FROM = 12; // glyphs from here on are the busy ones

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
const PAL_RGB: number[] = [];
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

function clamp(v: number, lo = 0, hi = 1) {
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

function hash(x: number, y: number, k: number) {
  const r = Math.sin((x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453);
  return r - Math.floor(r);
}


const INTRO = 2.6;
const LENS = 15; // lantern radius, in (square) cells
const NG = GLYPHS.length;
const NC = PAL_RGB.length / 3;

type Ripple = { x: number; y: number; t0: number };

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Everything that moves lives here: the grid itself is static data.
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes, uCell, uGrid, uVis, uView, uPtr, uFocus;
uniform float uTime, uSweep, uSlab, uActive, uFocusR, uFocusAmt;
uniform vec4 uSpark;
uniform vec3 uRip[4];
uniform sampler2D uData, uAtlas, uPal;

const float LEVELS = ${LEVELS}.0;
const float LENS = ${LENS}.0;
const float NG = ${NG}.0;
const float NC = ${NC}.0;
const float H_FOAM = ${H_FOAM}.0;
const float H_CARP = ${H_CARP}.0;
const float BUSY = ${SCRAMBLE_FROM}.0;

float hash(vec2 p, float k) {
  return fract(sin(dot(p + k * vec2(1.7, 9.2), vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 cellAt(vec2 s) {
  s = clamp(floor(s + 0.5), vec2(0.0), uGrid - 1.0);
  return floor(texture2D(uData, (s + 0.5) / uGrid) * 255.0 + 0.5);
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cf = frag / uCell;
  vec2 c = floor(cf);
  vec2 loc = cf - c;
  float nx = c.x / uVis.x;
  if (c.x >= uVis.x || c.y >= uVis.y || nx > uSweep) { gl_FragColor = vec4(0.0); return; }
  float t = uTime;
  float g;
  float hue;
  float lev;

  if (uSweep - nx < 0.06 && uSlab > 0.5) {
    // The loading sweep: a slab of scrambled glyphs ahead of the picture.
    g = BUSY + floor(hash(c, floor(t * 12.0)) * (NG - BUSY));
    hue = H_FOAM;
    lev = LEVELS - 1.0;
  } else {
    vec2 s = c + uView;
    float glow = 0.0;

    // Lantern: a magnifying lens around the pointer.
    if (uActive > 0.5) {
      vec2 d = c - uPtr;
      float len = length(vec2(d.x, d.y * 2.0));
      if (len < LENS) {
        float k = len / LENS;
        s = uView + uPtr + d * (0.55 + 0.45 * k * k);
        glow = 1.0 - k;
      }
    }

    // Ripples push the picture outwards.
    for (int i = 0; i < 4; i++) {
      float age = t - uRip[i].z;
      if (age >= 0.0 && age < 2.4) {
        vec2 d = c - uRip[i].xy;
        d.y *= 2.0;
        float len = max(length(d), 1.0);
        float r = (len - age * 26.0) / 3.0;
        float w = exp(-r * r) * sin(len * 0.9 - age * 12.0) * (1.0 - age / 2.4);
        s += vec2(d.x / len, d.y / len * 0.5) * w * 3.0;
      }
    }

    // Water and foam flow: small, smooth shifts of where each cell reads from.
    vec4 d0 = cellAt(s);
    if (d0.a > 100.5) {
      float a = d0.a < 101.5 ? 1.5 : 1.0;
      s += floor(vec2(a * sin(s.y * 0.27 + t * 1.3 + s.x * 0.03), 0.7 * a * sin(s.x * 0.11 - t * 0.9)) + 0.5);
    }

    vec4 d = cellAt(s);
    float kind = d.a - 100.0;
    g = d.r;
    if (g < 0.5) { gl_FragColor = vec4(0.0); return; }
    hue = d.g;
    lev = d.b;
    vec2 sc = floor(s + 0.5);

    if (kind < 0.5) {
      lev += floor(0.9 * sin(sc.x * 0.03 + sc.y * 0.06 - t * 0.25) + 0.5);
    } else if (kind < 1.5) {
      lev += floor(1.4 * sin(sc.x * 0.1 - sc.y * 0.45 + t * 2.0) + 0.5);
    } else {
      lev += floor(0.8 * sin(sc.x * 0.13 + sc.y * 0.3 - t * 1.6) + 0.5);
      if (hash(sc, floor(t * 7.0)) < 0.035) {
        float pick = floor(hash(sc.yx, 3.0) * 4.0);
        g = pick < 1.0 ? uSpark.x : pick < 2.0 ? uSpark.y : pick < 3.0 ? uSpark.z : uSpark.w;
        lev = LEVELS;
      }
    }
    if (glow > 0.0) {
      lev += floor(glow * 2.2 + 0.5);
      if (glow > 0.5) hue = H_CARP;
    }
    // Wiki spotlight: dim the print around the chosen spot and ring it in gold.
    if (uFocusAmt > 0.002) {
      float dist = length((sc - uFocus) * vec2(1.0, 2.0));
      float inside = 1.0 - smoothstep(uFocusR * 0.82, uFocusR, dist);
      lev += uFocusAmt * (inside * 1.5 - (1.0 - inside) * 2.6);
      float ring = 1.0 - smoothstep(0.0, 1.1, abs(dist - uFocusR));
      if (ring > 0.5 && hash(sc, floor(t * 5.0)) < 0.85) {
        g = uSpark.x;
        hue = H_CARP;
        lev = LEVELS;
      }
    }
    lev = clamp(floor(lev + 0.5), 0.0, LEVELS - 1.0);
  }

  float cov = texture2D(uAtlas, vec2((g + loc.x) / NG, loc.y)).a;
  vec3 col = texture2D(uPal, vec2((hue * LEVELS + lev + 0.5) / NC, 0.5)).rgb;
  gl_FragColor = vec4(col * cov, cov);
}
`;

type Props = {
  hotspots: Hotspot[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export default function KanagawaWave({ hotspots, activeId, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeRef = useRef(activeId);
  const hotspotsRef = useRef(hotspots);

  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);
  useEffect(() => {
    hotspotsRef.current = hotspots;
  }, [hotspots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const gl = canvas?.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!canvas || !host || !gl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, active: false };
    const pan = { x: 0.42, y: 0.25 };
    const focus = { x: 0, y: 0, r: 20, amt: 0 };
    const ripples: Ripple[] = [];
    const img = new Image();
    let ready = false;
    let family = "monospace";
    let dpr = 1;
    let Wd = 0; // canvas size in device pixels
    let Hd = 0;
    let cw = 8; // cell size in device pixels
    let ch = 16;
    let gc = 0; // grid size (whole picture, in cells)
    let gr = 0;
    let vc = 0; // visible size
    let vr = 0;
    let raf = 0;
    let disposed = false;
    let rebuild = 0;
    const start = performance.now();

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const U = (name: string) => gl.getUniformLocation(prog, name);

    const texture = (unit: number) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    };
    const dataTex = texture(0);
    const atlasTex = texture(1);
    const palTex = texture(2);
    gl.uniform1i(U("uData"), 0);
    gl.uniform1i(U("uAtlas"), 1);
    gl.uniform1i(U("uPal"), 2);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, palTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, NC, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(PAL_RGB));
    gl.uniform4f(U("uSpark"), SPARK[0], SPARK[1], SPARK[2], SPARK[3]);

    /** Ink pattern of every glyph, as a BXxBY grid of coverage values. */
    const glyphShapes = (fontSize: number) => {
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
    };

    const uploadAtlas = (fontSize: number) => {
      const a = document.createElement("canvas");
      a.width = NG * cw;
      a.height = ch;
      const c = a.getContext("2d");
      if (!c) return;
      c.font = `600 ${fontSize}px ${family}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "#fff";
      for (let i = 1; i < NG; i++) c.fillText(GLYPHS[i], i * cw + cw / 2, ch / 2 + 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, atlasTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, a);
    };

    /** Sample the print into the glyph grid. Runs on load and on resize. */
    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      Wd = Math.floor(canvas.clientWidth * dpr);
      Hd = Math.floor(canvas.clientHeight * dpr);
      if (!Wd || !Hd) return;
      canvas.width = Wd;
      canvas.height = Hd;
      gl.viewport(0, 0, Wd, Hd);

      cw = clamp(Math.ceil(Wd / 360), 4, 14);
      ch = cw * 2;
      const fontSize = cw / 0.58;
      vc = Math.ceil(Wd / cw);
      vr = Math.ceil(Hd / ch);
      // A little oversize, so the camera has room to pan and to clear the wiki panel.
      const scale = Math.max(Wd / img.naturalWidth, Hd / img.naturalHeight) * 1.14;
      gc = Math.max(vc, Math.ceil((img.naturalWidth * scale) / cw));
      gr = Math.max(vr, Math.ceil((img.naturalHeight * scale) / ch));

      const shapes = glyphShapes(fontSize);
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
      if (!o) return;
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

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, dataTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gc, gr, 0, gl.RGBA, gl.UNSIGNED_BYTE, cells);
      uploadAtlas(fontSize);
      gl.uniform2f(U("uRes"), Wd, Hd);
      gl.uniform2f(U("uCell"), cw, ch);
      gl.uniform2f(U("uGrid"), gc, gr);
      gl.uniform2f(U("uVis"), vc, vr);
    };

    const frame = (now: number) => {
      if (disposed) return;
      if (!reduced) raf = requestAnimationFrame(frame);
      if (!gc) return;
      const t = reduced ? INTRO + 6 : (now - start) / 1000;

      // Camera: the pointer pans around the print; otherwise it drifts gently.
      // Picking a wiki spot flies the camera to it instead.
      const spot = hotspotsRef.current.find((h) => h.id === activeRef.current);
      const narrow = canvas.clientWidth < 900;
      let tx = pointer.active ? pointer.x / canvas.clientWidth : 0.42 + 0.14 * Math.sin(t * 0.05);
      let ty = pointer.active ? 0.15 + 0.7 * (pointer.y / canvas.clientHeight) : 0.25;
      if (spot) {
        const gx = spot.u * gc;
        const gy = spot.v * gr;
        if (gc > vc) tx = clamp((gx - vc * (narrow ? 0.5 : 0.34)) / (gc - vc));
        if (gr > vr) ty = clamp((gy - vr * (narrow ? 0.28 : 0.5)) / (gr - vr));
        if (focus.amt < 0.02) {
          focus.x = gx;
          focus.y = gy;
        }
        focus.x += (gx - focus.x) * 0.12;
        focus.y += (gy - focus.y) * 0.12;
        focus.r += (spot.r * gc - focus.r) * 0.12;
      }
      focus.amt += ((spot ? 1 : 0) - focus.amt) * 0.08;
      pan.x += (tx - pan.x) * 0.06;
      pan.y += (ty - pan.y) * 0.06;

      const rip = new Float32Array(12).fill(0);
      for (let i = 0; i < 4; i++) rip[i * 3 + 2] = -100;
      ripples.slice(-4).forEach((r, i) => rip.set([r.x, r.y, r.t0], i * 3));

      const vx = Math.round((gc - vc) * clamp(pan.x));
      const vy = Math.round((gr - vr) * clamp(pan.y));
      gl.uniform2f(U("uView"), vx, vy);
      gl.uniform2f(U("uFocus"), focus.x, focus.y);
      gl.uniform1f(U("uFocusR"), focus.r);
      gl.uniform1f(U("uFocusAmt"), focus.amt);

      // Wiki markers ride along with the picture.
      const shown = clamp((t - INTRO) / 0.8);
      hotspotsRef.current.forEach((h, i) => {
        const el = markerRefs.current[i];
        if (!el) return;
        const x = ((h.u * gc - vx + 0.5) * cw) / dpr;
        const y = ((h.v * gr - vy + 0.5) * ch) / dpr;
        const on = x > 8 && y > 8 && x < canvas.clientWidth - 8 && y < canvas.clientHeight - 8;
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        el.style.opacity = on ? String(shown) : "0";
        el.style.pointerEvents = on && shown > 0.5 ? "auto" : "none";
      });
      gl.uniform2f(U("uPtr"), (pointer.x * dpr) / cw, (pointer.y * dpr) / ch);
      gl.uniform1f(U("uActive"), pointer.active ? 1 : 0);
      gl.uniform1f(U("uTime"), t);
      gl.uniform1f(U("uSweep"), clamp(t / INTRO) * 1.3);
      gl.uniform1f(U("uSlab"), t < INTRO + 0.4 ? 1 : 0);
      gl.uniform3fv(U("uRip"), rip);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onDown = (e: PointerEvent) => {
      onMove(e);
      ripples.push({ x: (pointer.x * dpr) / cw, y: (pointer.y * dpr) / ch, t0: (performance.now() - start) / 1000 });
      if (ripples.length > 4) ripples.shift();
    };

    const rebuildSoon = () => {
      window.clearTimeout(rebuild);
      rebuild = window.setTimeout(() => {
        if (disposed || !ready) return;
        build();
        if (reduced) frame(performance.now());
      }, 120);
    };

    img.onload = () => {
      if (disposed) return;
      ready = true;
      family = getComputedStyle(canvas).getPropertyValue("--font-geist-mono").trim() || "monospace";
      document.fonts.ready.then(() => {
        if (disposed) return;
        build();
        raf = requestAnimationFrame(frame);
      });
    };
    img.src = SRC;

    const ro = new ResizeObserver(rebuildSoon);
    ro.observe(canvas);
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointerleave", onLeave);

    return () => {
      disposed = true;
      window.clearTimeout(rebuild);
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={hostRef} className="absolute inset-0 touch-none overflow-hidden">
      <canvas
        ref={canvasRef}
        aria-label="The Great Wave off Kanagawa by Hokusai, drawn in animated ASCII"
        role="img"
        className="absolute inset-0 h-full w-full"
      />
      {hotspots.map((h, i) => (
        <button
          key={h.id}
          ref={(el) => {
            markerRefs.current[i] = el;
          }}
          type="button"
          onClick={() => onSelect(h.id)}
          aria-label={`${h.num} ${h.label}`}
          style={{ opacity: 0, pointerEvents: "none" }}
          className="group absolute left-0 top-0 z-10 font-mono will-change-transform"
        >
          <span
            className={`relative flex h-6 min-w-6 items-center justify-center rounded-full border px-1 text-[10px] font-semibold transition-colors ${
              activeId === h.id
                ? "border-[#E6C384] bg-[#E6C384] text-[#16161D]"
                : "border-[#E6C384] bg-[#16161D]/85 text-[#E6C384] group-hover:bg-[#E6C384] group-hover:text-[#16161D]"
            }`}
          >
            {activeId !== h.id && (
              <span className="absolute inset-0 animate-ping rounded-full border border-[#E6C384]/60" />
            )}
            {h.num}
          </span>
          <span className="pointer-events-none absolute left-full top-1/2 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-[#16161D]/90 px-1.5 py-0.5 text-[10px] tracking-widest text-[#DCD7BA] group-hover:block group-focus-visible:block">
            {h.label}
          </span>
        </button>
      ))}
    </div>
  );
}
