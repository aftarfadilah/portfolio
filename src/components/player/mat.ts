import * as THREE from "three";

/** The printed desk mat under the turntable: a retro-Japan record-ad poster. */
export function makeMatTexture(): THREE.CanvasTexture {
  const W = 2400;
  const H = 1600;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;

  const base = g.createLinearGradient(0, 0, W, H);
  base.addColorStop(0, "#1d1220");
  base.addColorStop(0.55, "#10131d");
  base.addColorStop(1, "#0e1a2c");
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);

  const glow = (x: number, y: number, r: number, rgb: string, a: number) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(${rgb},${a})`);
    rg.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
  };
  glow(W * 0.15, H * 0.12, 900, "245,155,180", 0.32);
  glow(W * 0.9, H * 0.92, 1000, "63,127,181", 0.4);

  // Halftone dots fading in from the lower right.
  g.fillStyle = "rgba(245,155,180,0.5)";
  for (let y = 0; y < H; y += 26) {
    for (let x = 0; x < W; x += 26) {
      const t = Math.max(0, (x / W + y / H - 0.9) / 1.1);
      const r = t * 7;
      if (r < 0.6) continue;
      g.beginPath();
      g.arc(x + ((y / 26) % 2) * 13, y, r, 0, Math.PI * 2);
      g.fill();
    }
  }

  // Giant outlined lettering.
  g.textBaseline = "alphabetic";
  g.lineJoin = "round";
  g.strokeStyle = "rgba(255,255,255,0.3)";
  g.lineWidth = 3;
  g.font = "italic 800 175px Georgia, 'Times New Roman', serif";
  g.strokeText("TURNTABLE", 665, 575);
  // Small print and registration marks.
  g.fillStyle = "rgba(201,204,210,0.6)";
  g.font = "500 26px 'Courier New', monospace";
  g.strokeStyle = "rgba(255,255,255,0.45)";
  g.lineWidth = 2;
  for (const [x, y] of [
    [60, 60],
    [W - 60, 60],
    [60, H - 60],
    [W - 60, H - 60],
  ]) {
    g.beginPath();
    g.moveTo(x - 24, y);
    g.lineTo(x + 24, y);
    g.moveTo(x, y - 24);
    g.lineTo(x, y + 24);
    g.stroke();
    g.beginPath();
    g.arc(x, y, 12, 0, Math.PI * 2);
    g.stroke();
  }

  // Fade the edges into the floor colour so the mat has no hard border.
  for (const [x0, y0, x1, y1] of [
    [0, 0, 0, H * 0.16],
    [0, H, 0, H * 0.84],
    [0, 0, W * 0.12, 0],
    [W, 0, W * 0.88, 0],
  ]) {
    const eg = g.createLinearGradient(x0, y0, x1, y1);
    eg.addColorStop(0, "#0b0d11");
    eg.addColorStop(1, "rgba(11,13,17,0)");
    g.fillStyle = eg;
    g.fillRect(0, 0, W, H);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Screen-space anchors of turntable parts, written by the 3D scene each frame. */
export const callouts: { x: number; y: number; on: boolean }[] = [
  { x: 0, y: 0, on: false },
  { x: 0, y: 0, on: false },
  { x: 0, y: 0, on: false },
];
