"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Spot } from "@/data/kanagawa-wiki";
import {
  GLYPHS,
  H_CARP,
  H_FOAM,
  LEVELS,
  NC,
  NG,
  PAL_RGB,
  SCRAMBLE_FROM,
  SPARK,
  SRC,
  clamp,
  drawStatic,
  sampleGrid,
  type Grid,
} from "./grid";

/**
 * The Great Wave off Kanagawa as dense, coloured, animated ASCII.
 *
 * The print is sampled into a fine glyph grid (see grid.ts). At runtime a
 * fragment shader draws that grid from a glyph atlas while the water flows,
 * the foam glitters, the pointer acts as a magnifying lantern and clicks send
 * ripples.
 *
 * Without WebGL (old devices, hardware acceleration off, a lost GPU context)
 * the same grid is drawn once as a still 2D frame. Markers, the camera and the
 * wiki keep working either way.
 */

const INTRO = 2.6;
const LENS = 15; // lantern radius, in (square) cells

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
  hotspots: Spot[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

type View = { gc: number; gr: number; vc: number; vr: number; vx: number; vy: number; cw: number; ch: number; dpr: number };

const noopSubscribe = () => () => {};
let webglOk: boolean | undefined;

/** Can this browser make a WebGL context at all? Cached; assumed true on the server. */
function supportsWebGL() {
  if (webglOk === undefined) {
    try {
      webglOk = !!document.createElement("canvas").getContext("webgl");
    } catch {
      webglOk = false;
    }
  }
  return webglOk;
}

/** Where the camera wants to be to show a spot: fractions 0..1 of the free pan range. */
function cameraFor(spot: Spot, g: Pick<Grid, "gc" | "gr" | "vc" | "vr">, narrow: boolean) {
  const gx = spot.u * g.gc;
  const gy = spot.v * g.gr;
  return {
    gx,
    gy,
    tx: g.gc > g.vc ? clamp((gx - g.vc * (narrow ? 0.5 : 0.34)) / (g.gc - g.vc)) : null,
    ty: g.gr > g.vr ? clamp((gy - g.vr * (narrow ? 0.28 : 0.5)) / (g.gr - g.vr)) : null,
  };
}

/** Wiki markers ride along with the picture. */
function placeMarkers(els: (HTMLButtonElement | null)[], spots: Spot[], v: View, w: number, h: number, shown: number) {
  spots.forEach((s, i) => {
    const el = els[i];
    if (!el) return;
    const x = ((s.u * v.gc - v.vx + 0.5) * v.cw) / v.dpr;
    const y = ((s.v * v.gr - v.vy + 0.5) * v.ch) / v.dpr;
    const on = x > 8 && y > 8 && x < w - 8 && y < h - 8;
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    el.style.opacity = on ? String(shown) : "0";
    el.style.pointerEvents = on && shown > 0.5 ? "auto" : "none";
  });
}

export default function KanagawaWave({ hotspots, activeId, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const stillRef = useRef<HTMLImageElement>(null);
  const markerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const repaintRef = useRef<(() => void) | null>(null);
  const activeRef = useRef(activeId);
  const hotspotsRef = useRef(hotspots);
  const [broken, setBroken] = useState(false); // WebGL died after it started
  const supported = useSyncExternalStore(noopSubscribe, supportsWebGL, () => true);
  const mode = supported && !broken ? "gl" : "static";

  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);
  useEffect(() => {
    hotspotsRef.current = hotspots;
  }, [hotspots]);

  // WebGL: animated.
  useEffect(() => {
    if (mode !== "gl") return;
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const gl = canvas?.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!canvas || !host) return;
    // The browser said yes earlier but refuses now (or the shader will not link): use the still.
    const giveUp = () => {
      window.setTimeout(() => setBroken(true), 0);
    };
    if (!gl) return giveUp();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, active: false };
    const pan = { x: 0.42, y: 0.25 };
    const focus = { x: 0, y: 0, r: 20, amt: 0 };
    const ripples: Ripple[] = [];
    const img = new Image();
    let ready = false;
    let family = "monospace";
    let dpr = 1;
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
      return giveUp();
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

    /** Sample the print into the glyph grid and upload it. Runs on load and on resize. */
    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const Wd = Math.floor(canvas.clientWidth * dpr);
      const Hd = Math.floor(canvas.clientHeight * dpr);
      if (!Wd || !Hd) return;
      canvas.width = Wd;
      canvas.height = Hd;
      gl.viewport(0, 0, Wd, Hd);

      const g = sampleGrid(img, Wd, Hd, family);
      if (!g) return;
      ({ cw, ch, gc, gr, vc, vr } = g);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, dataTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gc, gr, 0, gl.RGBA, gl.UNSIGNED_BYTE, g.cells);
      uploadAtlas(g.fontSize);
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
      let tx = pointer.active ? pointer.x / canvas.clientWidth : 0.42 + 0.14 * Math.sin(t * 0.05);
      let ty = pointer.active ? 0.15 + 0.7 * (pointer.y / canvas.clientHeight) : 0.25;
      if (spot) {
        const cam = cameraFor(spot, { gc, gr, vc, vr }, canvas.clientWidth < 900);
        if (cam.tx !== null) tx = cam.tx;
        if (cam.ty !== null) ty = cam.ty;
        if (focus.amt < 0.02) {
          focus.x = cam.gx;
          focus.y = cam.gy;
        }
        focus.x += (cam.gx - focus.x) * 0.12;
        focus.y += (cam.gy - focus.y) * 0.12;
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

      placeMarkers(
        markerRefs.current,
        hotspotsRef.current,
        { gc, gr, vc, vr, vx, vy, cw, ch, dpr },
        canvas.clientWidth,
        canvas.clientHeight,
        clamp((t - INTRO) / 0.8),
      );
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
    // The GPU took the context away: fall back to the still instead of freezing.
    const onLost = (e: Event) => {
      e.preventDefault();
      setBroken(true);
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
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      disposed = true;
      window.clearTimeout(rebuild);
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
    };
  }, [mode]);

  // No WebGL: one still frame, redrawn when the window resizes or a wiki spot is picked.
  useEffect(() => {
    if (mode !== "static") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const img = new Image();
    let grid: Grid | null = null;
    let family = "monospace";
    let dpr = 1;
    let disposed = false;
    let timer = 0;
    const pan = { x: 0.42, y: 0.25 };

    const paint = () => {
      if (!grid) return;
      const spot = hotspotsRef.current.find((h) => h.id === activeRef.current);
      if (spot) {
        const cam = cameraFor(spot, grid, canvas.clientWidth < 900);
        if (cam.tx !== null) pan.x = cam.tx;
        if (cam.ty !== null) pan.y = cam.ty;
      }
      const vx = Math.round((grid.gc - grid.vc) * clamp(pan.x));
      const vy = Math.round((grid.gr - grid.vr) * clamp(pan.y));
      drawStatic(ctx, grid, vx, vy, family);
      stillRef.current?.style.setProperty("display", "none");
      placeMarkers(
        markerRefs.current,
        hotspotsRef.current,
        { ...grid, vx, vy, dpr },
        canvas.clientWidth,
        canvas.clientHeight,
        1,
      );
    };

    repaintRef.current = paint;

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const Wd = Math.floor(canvas.clientWidth * dpr);
      const Hd = Math.floor(canvas.clientHeight * dpr);
      if (!Wd || !Hd) return;
      canvas.width = Wd;
      canvas.height = Hd;
      try {
        grid = sampleGrid(img, Wd, Hd, family);
        paint();
      } catch {
        grid = null; // keep the plain image showing
      }
    };

    img.onload = () => {
      family = getComputedStyle(canvas).getPropertyValue("--font-geist-mono").trim() || "monospace";
      document.fonts.ready.then(() => {
        if (!disposed) build();
      });
    };
    img.src = SRC;

    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!disposed && img.complete) build();
      }, 150);
    });
    ro.observe(canvas);

    return () => {
      disposed = true;
      repaintRef.current = null;
      window.clearTimeout(timer);
      ro.disconnect();
    };
  }, [mode]);

  // Repaint the still when the chosen spot changes.
  useEffect(() => {
    if (mode !== "static") return;
    repaintRef.current?.();
  }, [mode, activeId]);

  return (
    <div ref={hostRef} className="absolute inset-0 touch-none overflow-hidden">
      {mode === "static" && (
        <img
          ref={stillRef}
          src={SRC}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      <canvas
        key={mode}
        ref={canvasRef}
        aria-label="The Great Wave off Kanagawa by Hokusai, drawn in ASCII"
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
