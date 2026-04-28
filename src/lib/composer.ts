// Photo composition for layouts A/B/C/D
import GIF from "gif.js";

export type LayoutId = "A" | "B" | "C" | "D";

const WATERMARK = "เฮงที่ชอบพกกล้องมาวิทยาลัย";

async function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const ratio = Math.max(w / img.width, h / img.height);
  const nw = img.width * ratio;
  const nh = img.height * ratio;
  const ox = x + (w - nw) / 2;
  const oy = y + (h - nh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, ox, oy, nw, nh);
  ctx.restore();
}

function watermark(ctx: CanvasRenderingContext2D, x: number, y: number, align: CanvasTextAlign = "center") {
  ctx.save();
  ctx.font = "500 22px 'Noto Sans Thai', 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = align;
  ctx.textBaseline = "bottom";
  ctx.fillText(WATERMARK, x, y);
  ctx.restore();
}

/** Layout A — แบ่งให้เพื่อน — 1844x1240 landscape, 2 mirrored strips of 3 photos */
export async function renderLayoutA(photos: string[]): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1844;
  canvas.height = 1240;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, 1844, 1240);

  const imgs = await Promise.all(photos.slice(0, 3).map(loadImg));

  for (let strip = 0; strip < 2; strip++) {
    const xOffset = strip === 0 ? 0 : 942;
    drawCover(ctx, imgs[0], xOffset + 20, 20, 862, 370);
    drawCover(ctx, imgs[1], xOffset + 20, 410, 862, 370);
    drawCover(ctx, imgs[2], xOffset + 20, 800, 862, 370);
  }

  // Cut line — dashed
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(922, 0);
  ctx.lineTo(922, 1240);
  ctx.stroke();
  ctx.restore();
  // Scissors icon
  ctx.font = "28px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.textAlign = "center";
  ctx.fillText("✂️", 922, 32);

  watermark(ctx, 922, 1225, "center");
  return canvasToBlob(canvas);
}

/** Layout B — เต็มแผ่น 4x6 — 1844x1240, 2x2 grid */
export async function renderLayoutB(photos: string[]): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1844;
  canvas.height = 1240;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 1844, 1240);
  const imgs = await Promise.all(photos.slice(0, 4).map(loadImg));
  drawCover(ctx, imgs[0], 22, 20, 900, 600);
  drawCover(ctx, imgs[1], 942, 20, 900, 600);
  drawCover(ctx, imgs[2], 22, 640, 900, 600);
  drawCover(ctx, imgs[3], 942, 640, 900, 600);
  // Frame overlay (subtle inner border)
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 1840, 1236);
  // Watermark dark on white
  ctx.save();
  ctx.font = "500 22px 'Noto Sans Thai', sans-serif";
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(WATERMARK, 1820, 1225);
  ctx.restore();
  return canvasToBlob(canvas);
}

/** Layout C — ฟิล์มสตริป — 1240x1844 portrait */
export async function renderLayoutC(photos: string[]): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1844;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, 1240, 1844);
  // White border container
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(40, 40, 1160, 1764);
  const imgs = await Promise.all(photos.slice(0, 4).map(loadImg));
  drawCover(ctx, imgs[0], 40, 40, 1160, 380);
  drawCover(ctx, imgs[1], 40, 440, 1160, 380);
  drawCover(ctx, imgs[2], 40, 840, 1160, 380);
  drawCover(ctx, imgs[3], 40, 1240, 1160, 380);
  // Watermark on bottom white area
  ctx.save();
  ctx.font = "500 22px 'Noto Sans Thai', sans-serif";
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(WATERMARK, 620, 1720);
  ctx.restore();
  return canvasToBlob(canvas);
}

/** Layout D — GIF 800x600, 150ms/frame, looped */
export async function renderLayoutD(photos: string[]): Promise<Blob> {
  const imgs = await Promise.all(photos.slice(0, 4).map(loadImg));
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: 800,
    height: 600,
    workerScript: "/gif.worker.js",
  });
  for (const img of imgs) {
    const c = document.createElement("canvas");
    c.width = 800;
    c.height = 600;
    const cx = c.getContext("2d")!;
    cx.fillStyle = "#000";
    cx.fillRect(0, 0, 800, 600);
    drawCover(cx, img, 0, 0, 800, 600);
    // Watermark
    cx.font = "500 18px 'Noto Sans Thai', sans-serif";
    cx.fillStyle = "rgba(255,255,255,0.7)";
    cx.textAlign = "right";
    cx.textBaseline = "bottom";
    cx.fillText(WATERMARK, 790, 590);
    gif.addFrame(c, { delay: 150 });
  }
  return new Promise((res, rej) => {
    gif.on("finished", (blob: Blob) => res(blob));
    gif.on("abort", () => rej(new Error("GIF aborted")));
    gif.render();
  });
}

function canvasToBlob(c: HTMLCanvasElement, type = "image/jpeg", q = 0.97): Promise<Blob> {
  return new Promise((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("blob failed"))), type, q),
  );
}

export async function renderLayout(layout: LayoutId, photos: string[]): Promise<Blob> {
  switch (layout) {
    case "A": return renderLayoutA(photos);
    case "B": return renderLayoutB(photos);
    case "C": return renderLayoutC(photos);
    case "D": return renderLayoutD(photos);
  }
}

export const LAYOUTS = [
  { id: "A" as const, label: "แบ่งให้เพื่อน", emoji: "✂️", desc: "ได้ 2 แถบ ตัดแบ่งกับเพื่อนได้เลย", needsCount: 3 },
  { id: "B" as const, label: "เต็มแผ่น 4x6", emoji: "⭐", desc: "คอลลาจ 4 รูปในแผ่นเดียว", recommended: true, needsCount: 4 },
  { id: "C" as const, label: "ฟิล์มสตริป", emoji: "🎞️", desc: "สไตล์ตู้โฟโต้บูธคลาสสิก", needsCount: 4 },
  { id: "D" as const, label: "GIF เคลื่อนไหว", emoji: "✨", desc: "4 รูปทำเป็น GIF แชร์ได้เลย", digitalOnly: true, needsCount: 4 },
];
