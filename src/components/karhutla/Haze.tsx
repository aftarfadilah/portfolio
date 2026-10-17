"use client";

import { useEffect, useRef, useState } from "react";
import { serif, type T } from "./shared";

/**
 * A veil of smoke over the whole screen. Swipe (touch) or move the mouse to push it aside.
 *
 * It is a smoke interaction, not an eraser:
 *  - the brush trails your pointer with a little inertia, so strokes are smooth curves;
 *  - your movement drags the smoke along with it (a displacement field), and the smoke drifts
 *    back afterwards;
 *  - clearing is a wide, gradual thinning, thickest smoke last, with no cut-out edge;
 *  - the cleared patch spreads and slowly closes again.
 * Progress counts what you have cleared in total; past half, the rest lifts.
 * The button is the keyboard route. Without WebGL there is no haze and the page just opens.
 */

const GOAL = 0.38; // share cleared (cumulatively) at which the rest lifts
const LIFT_MS = 2800;
const SCALE = 0.5; // the shader runs at half resolution: smoke is soft, and it is cheap
const FW = 128; // width of the interaction grid
const FOLLOW = 7; // how quickly the brush catches up with the pointer (per second)
const DECAY = 0.04; // per second: how fast cleared patches fade back
const SPREAD = 0.28; // per frame: how fast clearing diffuses outward
const SETTLE = 0.16; // per second: how fast dragged smoke drifts back

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uLift;
uniform vec2 uTexel;
uniform sampler2D uField; // r: cleared, g/b: how far the smoke has been dragged (0.5 = none)

float hash(vec2 p) {
  p = fract(p * vec2(0.1031, 0.1030));
  p += dot(p, p.yx + 33.33);
  return fract((p.x + p.y) * p.x);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.0);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 fuv = vec2(uv.x, 1.0 - uv.y);

  vec4 f = texture2D(uField, fuv);
  float c = f.r;
  // the smoke has been dragged by this much (screen y is flipped between the grid and the shader)
  vec2 drag = (f.gb - 0.5) * 2.4;
  drag.y = -drag.y;
  float gx = texture2D(uField, fuv + vec2(uTexel.x, 0.0)).r - texture2D(uField, fuv - vec2(uTexel.x, 0.0)).r;
  float gy = texture2D(uField, fuv + vec2(0.0, uTexel.y)).r - texture2D(uField, fuv - vec2(0.0, uTexel.y)).r;

  vec2 p = vec2(uv.x * uRes.x / uRes.y, uv.y) * 1.5;
  float t = uTime * 0.035;

  // smoke is carried along with the swipe, bunches slightly at the edge of the cleared patch,
  // and keeps flowing on its own
  vec2 q = p - drag * 0.9 + vec2(gx, -gy) * 0.4;
  vec2 w = vec2(fbm(q + vec2(t, 0.0)), fbm(q + vec2(5.2, 1.3) - vec2(0.0, t)));
  float d = fbm(q + 1.7 * (w - 0.5) + vec2(t * 1.4, -t * 0.8));
  float dens = smoothstep(0.2, 0.82, d);

  // clearing is gradual: thin smoke thins out faster, thick smoke clings on, nothing is cut
  float ce = c + uLift * 1.7;
  float hard = mix(1.3, 0.7, dens);
  float a = 1.0 - smoothstep(0.02, 1.0, ce * hard);

  vec3 dark = vec3(0.39, 0.36, 0.34);
  vec3 light = vec3(0.84, 0.80, 0.76);
  vec3 warm = vec3(0.93, 0.69, 0.49);
  float k = smoothstep(0.3, 0.8, d);
  vec3 col = mix(dark, light, k);
  float sun = smoothstep(0.35, 0.85, fbm(p * 0.9 + vec2(3.0, t * 0.5))) * smoothstep(0.5, 1.0, k) * 0.38;
  col = mix(col, warm, sun);
  // thinning smoke is lit from behind by what it is letting through
  col += vec3(0.07, 0.05, 0.03) * (a * (1.0 - a) * 4.0);
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col * a, a);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
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

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = c.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
    const vs = gl && compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = gl && compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl && vs && fs ? gl.createProgram() : null;
    if (!gl || !vs || !fs || !prog) {
      // No WebGL: skip the veil rather than block the page.
      const id = window.setTimeout(() => {
        setGone(true);
        onStart();
        onCleared();
      }, 0);
      return () => window.clearTimeout(id);
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uLift = gl.getUniformLocation(prog, "uLift");
    const uTexel = gl.getUniformLocation(prog, "uTexel");
    gl.uniform1i(gl.getUniformLocation(prog, "uField"), 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    let W = 0;
    let H = 0;
    let fh = 1;
    // clear: what is cleared right now; perm: what was ever cleared; dx/dy: how far smoke was dragged
    let clear = new Float32Array(FW);
    let perm = new Float32Array(FW);
    let dx = new Float32Array(FW);
    let dy = new Float32Array(FW);
    let sc = new Float32Array(FW);
    let sx = new Float32Array(FW);
    let sy = new Float32Array(FW);
    let bytes = new Uint8Array(FW * 4);
    let target: { x: number; y: number } | null = null; // where the pointer is (grid units)
    let brush: { x: number; y: number } | null = null; // where the brush has got to
    let lastCheck = 0;
    let started = false;
    let done = false;
    let liftAt = 0;
    let raf = 0;
    let timer = 0;
    let prev = performance.now();
    const t0 = prev;

    const resample = (src: Float32Array, oh: number, nh: number) => {
      const out = new Float32Array(FW * nh);
      for (let y = 0; y < nh; y++) {
        const syy = Math.min(oh - 1, Math.floor((y / nh) * oh));
        for (let x = 0; x < FW; x++) out[y * FW + x] = src[syy * FW + x];
      }
      return out;
    };

    const layout = () => {
      const r = el.getBoundingClientRect();
      const nw = Math.max(1, Math.round(r.width));
      const nh = Math.max(1, Math.round(r.height));
      if (W && Math.abs(nw - W) < 2 && Math.abs(nh - H) < 2) return;
      W = nw;
      H = nh;
      c.width = Math.max(1, Math.round(W * SCALE));
      c.height = Math.max(1, Math.round(H * SCALE));
      gl.viewport(0, 0, c.width, c.height);
      const nfh = Math.max(40, Math.round((FW * H) / W));
      // keep what has been cleared when the viewport changes (mobile toolbars do this)
      clear = resample(clear, fh, nfh);
      perm = resample(perm, fh, nfh);
      dx = resample(dx, fh, nfh);
      dy = resample(dy, fh, nfh);
      fh = nfh;
      sc = new Float32Array(FW * fh);
      sx = new Float32Array(FW * fh);
      sy = new Float32Array(FW * fh);
      bytes = new Uint8Array(FW * fh * 4);
      gl.uniform2f(uRes, c.width, c.height);
      gl.uniform2f(uTexel, 1 / FW, 1 / fh);
    };

    /** Press clearing and a push in direction (vx, vy) into the grid around (cx, cy). */
    const stamp = (cx: number, cy: number, R: number, vx: number, vy: number) => {
      const x0 = Math.max(0, Math.floor(cx - R));
      const x1 = Math.min(FW - 1, Math.ceil(cx + R));
      const y0 = Math.max(0, Math.floor(cy - R));
      const y1 = Math.min(fh - 1, Math.ceil(cy + R));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const d = Math.hypot(x - cx, y - cy) / R;
          if (d >= 1) continue;
          const w = Math.exp(-d * d * 1.8);
          const i = y * FW + x;
          clear[i] = Math.min(1, clear[i] + w * 0.12);
          perm[i] = Math.min(1, perm[i] + w * 0.2); // progress is counted separately, so it ignores fading
          dx[i] = Math.max(-0.5, Math.min(0.5, dx[i] + vx * w * 0.06));
          dy[i] = Math.max(-0.5, Math.min(0.5, dy[i] + vy * w * 0.06));
        }
      }
    };

    const radius = () => (Math.max(110, Math.min(W, H) * 0.22) / W) * FW;

    /** The brush eases toward the pointer and stamps along the way, so strokes are smooth. */
    const follow = (dt: number, immediate: boolean) => {
      if (!target) return;
      if (!brush) {
        brush = { ...target };
        stamp(brush.x, brush.y, radius(), 0, 0);
        return;
      }
      const k = immediate ? 1 : 1 - Math.exp(-dt * FOLLOW);
      const nx = brush.x + (target.x - brush.x) * k;
      const ny = brush.y + (target.y - brush.y) * k;
      const mx = nx - brush.x;
      const my = ny - brush.y;
      const len = Math.hypot(mx, my);
      if (len < 0.01) return;
      const R = radius();
      const steps = Math.max(1, Math.ceil(len / (R * 0.25)));
      // direction scaled by speed, so a quick flick drags more smoke than a slow drift
      const push = Math.min(2.2, len / (R * 0.3));
      for (let i = 1; i <= steps; i++) stamp(brush.x + (mx * i) / steps, brush.y + (my * i) / steps, R, (mx / len) * push, (my / len) * push);
      brush = { x: nx, y: ny };
    };

    const cleared = () => {
      let s = 0;
      for (let i = 0; i < perm.length; i++) s += perm[i];
      return s / perm.length;
    };

    const blur = (src: Float32Array, dst: Float32Array, amount: number, fade: number) => {
      for (let y = 0; y < fh; y++) {
        for (let x = 0; x < FW; x++) {
          const i = y * FW + x;
          const l = src[x > 0 ? i - 1 : i];
          const r = src[x < FW - 1 ? i + 1 : i];
          const u = src[y > 0 ? i - FW : i];
          const d = src[y < fh - 1 ? i + FW : i];
          dst[i] = src[i] + ((l + r + u + d) * 0.25 - src[i]) * amount;
          dst[i] = dst[i] > 0 ? Math.max(0, dst[i] - fade) : Math.min(0, dst[i] - fade * Math.sign(dst[i]));
        }
      }
    };

    /** Cleared patches spread and fade; dragged smoke softens and drifts back. */
    const settle = (dt: number) => {
      blur(clear, sc, SPREAD, DECAY * dt);
      [clear, sc] = [sc, clear];
      const back = Math.exp(-dt * SETTLE);
      blur(dx, sx, 0.2, 0);
      [dx, sx] = [sx, dx];
      blur(dy, sy, 0.2, 0);
      [dy, sy] = [sy, dy];
      for (let i = 0; i < dx.length; i++) {
        dx[i] *= back;
        dy[i] *= back;
      }
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (!reduced) {
        follow(dt, false);
        settle(dt);
      }
      for (let i = 0; i < clear.length; i++) {
        bytes[i * 4] = Math.round(clear[i] * 255);
        bytes[i * 4 + 1] = Math.round((0.5 + dx[i]) * 255);
        bytes[i * 4 + 2] = Math.round((0.5 + dy[i]) * 255);
        bytes[i * 4 + 3] = 255;
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, FW, fh, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
      gl.uniform1f(uTime, reduced ? 5 : (now - t0) / 1000);
      const l = liftAt ? Math.min(1, (now - liftAt) / LIFT_MS) : 0;
      gl.uniform1f(uLift, l * l * (3 - 2 * l));
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!done && !reduced && now - lastCheck > 200) {
        lastCheck = now;
        if (started && cleared() >= GOAL) finish();
      }
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };

    const finish = () => {
      if (done) return;
      done = true;
      liftAt = performance.now();
      setLifting(true);
      onCleared();
      if (reduced) raf = requestAnimationFrame(loop); // let the lift play even though nothing else moves
      timer = window.setTimeout(() => setGone(true), LIFT_MS + 150);
    };
    lift.current = () => {
      if (!started) {
        started = true;
        setTouched(true);
        onStart();
      }
      finish();
    };

    const toGrid = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      return { x: ((e.clientX - b.left) / W) * FW, y: ((e.clientY - b.top) / H) * fh };
    };
    const onMove = (e: PointerEvent) => {
      if (done) return;
      // a mouse wipes just by moving; a finger or pen has to be down
      if (e.pointerType !== "mouse" && e.buttons === 0) return;
      if (!started) {
        started = true;
        setTouched(true);
        onStart();
      }
      target = toGrid(e);
      if (reduced) {
        follow(0, true);
        draw(performance.now());
        if (cleared() >= GOAL) finish();
      }
    };
    const onDown = (e: PointerEvent) => {
      // a press on the button is a click, not a wipe (capturing the pointer would swallow it)
      if ((e.target as Element | null)?.closest("button")) return;
      brush = null;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
      onMove(e);
    };
    const onEnd = () => {
      target = null;
      brush = null;
    };

    layout();
    if (reduced) draw(performance.now());
    else raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(() => {
      layout();
      if (reduced) draw(performance.now());
    });
    ro.observe(el);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onEnd);
    el.addEventListener("pointerleave", onEnd);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.clearTimeout(timer);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onEnd);
      el.removeEventListener("pointerleave", onEnd);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // onStart / onCleared are stable setters from the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <div ref={box} className="absolute inset-0 z-30 cursor-grab touch-none select-none" style={{ pointerEvents: lifting ? "none" : "auto" }}>
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
        className={`absolute bottom-7 left-1/2 -translate-x-1/2 border border-[#1a1410]/60 bg-[#efe7dc]/30 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[#1a1410] backdrop-blur-sm transition-opacity duration-700 hover:bg-[#efe7dc]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1410] ${lifting ? "opacity-0" : "opacity-100"}`}
      >
        {t("hazeSkip")}
      </button>
    </div>
  );
}
