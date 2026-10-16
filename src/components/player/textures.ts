import { CanvasTexture, SRGBColorSpace } from "three";

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Concentric record grooves with a few track gaps. Radial, so it can spin invisibly. */
export function makeGrooveTexture(): CanvasTexture {
  const size = 1024;
  const half = size / 2;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0b0b0d";
  ctx.fillRect(0, 0, size, size);

  const rand = seeded(7);
  ctx.lineWidth = 0.8;
  for (let r = half * 0.36; r < half * 0.985; r += 1.7) {
    ctx.strokeStyle = `rgba(255,255,255,${(0.015 + rand() * 0.05).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(half, half, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const f of [0.52, 0.66, 0.8]) {
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(half, half, half * f, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(half, half, half * f + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Loads the (same-origin proxied) YouTube thumbnail and center-crops it to a square label. */
export function loadLabelTexture(videoId: string): Promise<CanvasTexture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const side = Math.min(img.width, img.height);
      ctx.drawImage(
        img,
        (img.width - side) / 2,
        (img.height - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size,
      );
      const tex = new CanvasTexture(canvas);
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 8;
      resolve(tex);
    };
    img.onerror = () => reject(new Error("Thumbnail failed to load"));
    img.src = `/api/youtube/thumb?id=${encodeURIComponent(videoId)}`;
  });
}
