import * as THREE from "three";

export const SKIN = "#f3dea6";
const OUTLINE = "#2c4a72";

/**
 * Sphere UVs put the front of the head at u = 0.25, and one degree is the same
 * number of pixels either way on a 2:1 canvas, so features are laid out in
 * degrees from the front-centre line (dx) and down from the crown (theta).
 */
const W = 2048;
const H = 1024;
const PX = W / 360;

function eye(
  g: CanvasRenderingContext2D,
  dx: number,
  theta: number,
  w: number,
  h: number,
  tilt: number,
  lid?: number,
) {
  g.save();
  g.translate(W * 0.25 + dx * PX, theta * PX);
  g.rotate(tilt);

  g.beginPath();
  g.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  const iris = g.createLinearGradient(0, -h / 2, 0, h / 2);
  iris.addColorStop(0, "#c4ecf6");
  iris.addColorStop(0.55, "#8fd2e8");
  iris.addColorStop(1, "#5ea6cd");
  g.fillStyle = iris;
  g.fill();

  g.lineCap = "round";
  g.lineWidth = 11;
  g.strokeStyle = OUTLINE;

  if (lid === undefined) {
    g.beginPath();
    g.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    g.stroke();
  } else {
    // Half-closed: skin-coloured lid over the top, a flat dark lash line, and
    // an outline only on the part of the ring that is still showing.
    const lidY = -h / 2 + h * lid;
    g.save();
    g.beginPath();
    g.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    g.clip();
    g.fillStyle = SKIN;
    g.fillRect(-w, -h, w * 2, lidY + h);
    g.restore();

    const t0 = Math.asin(THREE.MathUtils.clamp(lidY / (h / 2), -1, 1));
    g.beginPath();
    g.ellipse(0, 0, w / 2, h / 2, 0, t0, Math.PI - t0);
    g.stroke();

    g.lineWidth = 13;
    g.beginPath();
    g.moveTo(-w / 2 - 6, lidY + 4);
    g.lineTo(w / 2 + 6, lidY - 4);
    g.stroke();
  }
  g.restore();
}

export function makeFaceTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;

  g.fillStyle = SKIN;
  g.fillRect(0, 0, W, H);

  // Viewer's left eye is the half-lidded one; the right one is wide open.
  eye(g, -22, 97, 128, 136, -0.08, 0.42);
  eye(g, 22, 97, 124, 150, 0.1);

  // Beauty mark outside the left eye.
  g.fillStyle = "#26304f";
  g.beginPath();
  g.arc(W * 0.25 - 38 * PX, 108 * PX, 8, 0, Math.PI * 2);
  g.fill();

  // The tiny flat frown.
  g.strokeStyle = "#4b4560";
  g.lineWidth = 8;
  g.lineCap = "round";
  g.beginPath();
  g.arc(W * 0.25, 116 * PX + 14, 22, Math.PI * 1.08, Math.PI * 1.92);
  g.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function makeShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, "rgba(0,0,0,0.55)");
  rg.addColorStop(0.6, "rgba(0,0,0,0.18)");
  rg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
