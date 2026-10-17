import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

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
export function loadLabelTexture(videoId: string, size = 512): Promise<CanvasTexture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
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

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/.{1,2}$/, "")}…`;
  }
  return lines;
}

/** Back of the sleeve: title, artist and a fake catalogue strip. */
export function makeBackTexture(title: string, author: string, videoId: string): CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#17181f";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#f2efe6";
  ctx.font = "600 64px system-ui, sans-serif";
  const lines = wrap(ctx, title, size - 160, 4);
  lines.forEach((l, i) => ctx.fillText(l, 80, 170 + i * 78));
  ctx.fillStyle = "#9aa0b4";
  ctx.font = "400 40px system-ui, sans-serif";
  ctx.fillText(author, 80, 170 + lines.length * 78 + 30);
  ctx.fillStyle = "#6b7088";
  ctx.font = "400 28px ui-monospace, monospace";
  ctx.fillText(`33⅓ RPM  ·  STEREO  ·  ${videoId.toUpperCase()}`, 80, size - 90);
  ctx.fillRect(80, size - 70, size - 160, 2);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Fine wood grain for the rack. */
export function makeWoodTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#7a5436";
  ctx.fillRect(0, 0, 512, 128);
  const rand = seeded(11);
  for (let i = 0; i < 90; i++) {
    const y = rand() * 128;
    ctx.strokeStyle = `rgba(${rand() > 0.5 ? "40,24,12" : "160,110,70"},${(0.05 + rand() * 0.14).toFixed(2)})`;
    ctx.lineWidth = 0.6 + rand() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + rand() * 6 - 3, 340, y + rand() * 6 - 3, 512, y + rand() * 4 - 2);
    ctx.stroke();
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}
