import * as THREE from "three";

export const SKIN = "#ecd3a6";

/**
 * Sphere UVs put the front of the head at u = 0.25, and one degree is the same
 * number of pixels either way on a 2:1 canvas, so features are laid out in
 * degrees from the front-centre line (dx) and down from the crown (theta).
 */
const W = 2048;
const H = 1024;
const PX = W / 360;

/** Diagonal satin-stitch look for embroidered outlines. */
function stitchPattern(g: CanvasRenderingContext2D, base: string, light: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 10;
  const p = c.getContext("2d")!;
  p.fillStyle = base;
  p.fillRect(0, 0, 10, 10);
  p.strokeStyle = light;
  p.lineWidth = 3;
  for (const o of [-10, 0, 10]) {
    p.beginPath();
    p.moveTo(o, 10);
    p.lineTo(o + 10, 0);
    p.stroke();
  }
  return g.createPattern(c, "repeat")!;
}

/** Flat top, rounded drop at the bottom: the plush's embroidered eye. */
function eye(
  g: CanvasRenderingContext2D,
  dx: number,
  theta: number,
  w: number,
  h: number,
  tilt: number,
  stitch: CanvasPattern,
) {
  g.save();
  g.translate(W * 0.25 + dx * PX, theta * PX);
  g.rotate(tilt);

  const shape = () => {
    g.beginPath();
    g.moveTo(-w / 2, -h / 2);
    g.lineTo(w / 2, -h / 2);
    g.bezierCurveTo(w / 2, h * 0.08, w * 0.3, h / 2, w * 0.04, h / 2);
    g.bezierCurveTo(-w * 0.3, h / 2, -w / 2, h * 0.08, -w / 2, -h / 2);
    g.closePath();
  };

  shape();
  const fill = g.createRadialGradient(0, h * 0.05, 4, 0, h * 0.05, h * 0.62);
  fill.addColorStop(0, "#8fb0c1");
  fill.addColorStop(1, "#6f93a8");
  g.fillStyle = fill;
  g.fill();

  g.lineJoin = "round";
  g.lineCap = "round";
  g.lineWidth = 22;
  g.strokeStyle = stitch;
  shape();
  g.stroke();
  g.restore();
}

export function makeFaceTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;

  g.fillStyle = SKIN;
  g.fillRect(0, 0, W, H);

  const blue = stitchPattern(g, "#1b86ea", "#52b6ff");
  // Slightly sad: top edges slant down towards the outer corners.
  eye(g, -22, 99, 152, 150, -0.1, blue);
  eye(g, 22, 99, 144, 168, 0.12, blue);

  // Beauty mark outside the left eye.
  g.fillStyle = "#15131a";
  g.beginPath();
  g.arc(W * 0.25 - 40 * PX, 111 * PX, 9, 0, Math.PI * 2);
  g.fill();

  // Black stitched mouth with a little kink.
  g.strokeStyle = "#15131a";
  g.lineWidth = 13;
  g.lineCap = "round";
  g.lineJoin = "round";
  const mx = W * 0.25;
  const my = 117 * PX;
  g.beginPath();
  g.moveTo(mx - 46, my + 8);
  g.lineTo(mx - 28, my - 1);
  g.lineTo(mx - 2, my - 9);
  g.lineTo(mx + 13, my - 11);
  g.lineTo(mx + 22, my + 1);
  g.lineTo(mx + 46, my + 13);
  g.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Soft fleece grain, used as a bump map so cloth doesn't look like plastic. */
export function makeFleeceTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const img = g.createImageData(S, S);
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < S * S; i++) {
    const v = 110 + rnd() * 90;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // A blur pass turns the noise into soft tufts instead of sand.
  g.filter = "blur(1.2px)";
  g.globalAlpha = 0.9;
  g.drawImage(c, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 4);
  return tex;
}

export function makeShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, "rgba(0,0,0,0.6)");
  rg.addColorStop(0.55, "rgba(0,0,0,0.22)");
  rg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
