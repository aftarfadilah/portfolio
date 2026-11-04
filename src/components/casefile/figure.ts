/**
 * A standing figure, defined as a signed distance field so the same data gives us
 * the silhouette (for the text to wrap around), the shading (for the dither and
 * scan looks) and the per-row edges. Pure maths: no canvas, safe to run on the server.
 *
 * Drop a real cut-out photo in later by replacing getField() with one built from its alpha.
 */
export const FIG_W = 220;
export const FIG_H = 560;

/** Capsules: ax, ay, bx, by, radius. Tapered limbs are chains of them. */
const CAPS: number[][] = [
  [109, 80, 109, 92, 9], // neck
  [88, 111, 136, 111, 15], // shoulders
  [112, 118, 113, 196, 35], // hoodie torso
  [112, 196, 113, 214, 38], // hoodie hem
  [82, 116, 79, 172, 12], // near upper arm (hanging)
  [79, 172, 90, 222, 9.5], // near forearm, hand in pocket
  [139, 116, 150, 172, 12], // far upper arm
  [150, 172, 129, 106, 9], // far forearm, raised to the face
  [127, 105, 124, 88, 6.5], // hand and phone
  [98, 218, 128, 218, 22], // hips
  [99, 226, 97, 296, 20], // near thigh
  [97, 296, 95, 360, 16], // near knee
  [95, 360, 93, 462, 12.5], // near calf
  [127, 226, 129, 296, 20], // far thigh
  [129, 296, 131, 360, 16], // far knee
  [131, 360, 133, 462, 12.5], // far calf
  [93, 474, 72, 490, 10], // near shoe
  [133, 474, 154, 490, 10], // far shoe
  [97, 41, 72, 49, 4.5], // cap brim
];

/** Ellipses: cx, cy, rx, ry. */
const ELLS: number[][] = [
  [112, 55, 21, 26], // head
  [110, 41, 24, 15], // cap
];

const sd = (x: number, y: number) => {
  let d = 1e9;
  for (const [ax, ay, bx, by, r] of CAPS) {
    const px = x - ax;
    const py = y - ay;
    const dx = bx - ax;
    const dy = by - ay;
    const h = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy || 1)));
    const e = Math.hypot(px - dx * h, py - dy * h) - r;
    if (e < d) d = e;
  }
  for (const [cx, cy, rx, ry] of ELLS) {
    const e = (Math.hypot((x - cx) / rx, (y - cy) / ry) - 1) * Math.min(rx, ry);
    if (e < d) d = e;
  }
  return d;
};

export interface Field {
  /** Signed distance in logical pixels: negative inside the figure. */
  sdf: Float32Array;
  /** Pseudo-3D light, 0..1, lit from the upper left. */
  lum: Float32Array;
  /** Leftmost / rightmost inside x per row, or -1 on empty rows. */
  left: Int16Array;
  right: Int16Array;
}

let cache: Field | null = null;

export function getField(): Field {
  if (cache) return cache;
  const sdf = new Float32Array(FIG_W * FIG_H);
  const lum = new Float32Array(FIG_W * FIG_H);
  const left = new Int16Array(FIG_H).fill(-1);
  const right = new Int16Array(FIG_H).fill(-1);

  for (let y = 0; y < FIG_H; y++) {
    for (let x = 0; x < FIG_W; x++) {
      const d = sd(x, y);
      sdf[y * FIG_W + x] = d;
      if (d < 0) {
        if (left[y] < 0) left[y] = x;
        right[y] = x;
      }
    }
  }

  const R = 15;
  const L = [-0.55, -0.45, 0.7];
  const ln = Math.hypot(L[0], L[1], L[2]);
  for (let y = 1; y < FIG_H - 1; y++) {
    for (let x = 1; x < FIG_W - 1; x++) {
      const i = y * FIG_W + x;
      const d = sdf[i];
      if (d > 0.5) continue;
      let gx = sdf[i + 1] - sdf[i - 1];
      let gy = sdf[i + FIG_W] - sdf[i - FIG_W];
      const gl = Math.hypot(gx, gy) || 1;
      gx /= gl;
      gy /= gl;
      const t = Math.min(1, -d / R);
      const z = Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t)));
      const k = 1 - t;
      const nl = Math.hypot(gx * k, gy * k, z) || 1;
      const dot = ((gx * k * L[0] + gy * k * L[1] + z * L[2]) / (nl * ln)) * 0.95 + 0.18;
      // A thin rim on the shadow side keeps the edge readable.
      const rim = (gx * 0.6 + gy * 0.2 > 0.35 ? 0.18 : 0) * (1 - t);
      lum[i] = Math.max(0, Math.min(1, dot + rim));
    }
  }

  cache = { sdf, lum, left, right };
  return cache;
}

/** Silhouette edges at a vertical fraction of the figure (0 top, 1 bottom), as fractions of its width. */
export function edgesAt(fy: number): { l: number; r: number } | null {
  if (fy < 0 || fy >= 1) return null;
  const { left, right } = getField();
  const y = Math.min(FIG_H - 1, Math.floor(fy * FIG_H));
  // A few rows either side so a line's whole height clears the figure.
  let l = Infinity;
  let r = -Infinity;
  for (let dy = -4; dy <= 4; dy++) {
    const yy = Math.max(0, Math.min(FIG_H - 1, y + dy));
    if (left[yy] >= 0) {
      l = Math.min(l, left[yy]);
      r = Math.max(r, right[yy]);
    }
  }
  return Number.isFinite(l) ? { l: l / FIG_W, r: (r + 1) / FIG_W } : null;
}
