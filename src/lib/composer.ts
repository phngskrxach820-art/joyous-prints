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

async function loadFramePNG(format: "strip" | "full"): Promise<HTMLImageElement | null> {
  const path = format === "strip" ? "/frames/frame_strip.png" : "/frames/frame_full.png";
  try {
    return await loadImg(path);
  } catch {
    return null;
  }
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
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

function drawCoverFiltered(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
  filter: string,
) {
  const prev = ctx.filter;
  ctx.filter = filter || "none";
  drawCover(ctx, img, x, y, w, h);
  ctx.filter = prev;
}

// Print sheet 100x148mm portrait
export const CANVAS_W = 1240;
export const CANVAS_H = 1844;

const STRIP_SLOTS_LEFT = [
  { x: 110, y: 390,  w: 413, h: 230 },
  { x: 110, y: 684,  w: 413, h: 230 },
  { x: 110, y: 1004, w: 413, h: 231 },
  { x: 110, y: 1285, w: 413, h: 232 },
];
const STRIP_SLOTS_RIGHT = [
  { x: 735, y: 389,  w: 414, h: 232 },
  { x: 735, y: 684,  w: 414, h: 230 },
  { x: 735, y: 1004, w: 414, h: 231 },
  { x: 735, y: 1286, w: 415, h: 231 },
];

function drawSlotWithFilter(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slot: { x: number; y: number; w: number; h: number },
  filter: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(slot.x, slot.y, slot.w, slot.h);
  ctx.clip();
  if (filter && filter !== "none") ctx.filter = filter;
  const ratio = Math.max(slot.w / img.naturalWidth, slot.h / img.naturalHeight);
  const nw = img.naturalWidth * ratio;
  const nh = img.naturalHeight * ratio;
  const ox = slot.x + (slot.w - nw) / 2;
  const oy = slot.y + (slot.h - nh) / 2;
  ctx.drawImage(img, ox, oy, nw, nh);
  ctx.filter = "none";
  ctx.restore();
}
const FULL_SLOTS = [
  { x: 40,  y: 60,   w: 560, h: 840 },
  { x: 640, y: 60,   w: 560, h: 840 },
  { x: 40,  y: 940,  w: 560, h: 840 },
  { x: 640, y: 940,  w: 560, h: 840 },
];

/** Layout A — 2x6 strip. 3 photos x 2 columns. */
export async function renderLayoutA(photos: string[], filter: string = "none"): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const imgs = await Promise.all(photos.slice(0, 4).map(loadImg));

  STRIP_SLOTS_LEFT.forEach((slot, i) => {
    if (imgs[i]) drawSlotWithFilter(ctx, imgs[i], slot, filter);
  });
  STRIP_SLOTS_RIGHT.forEach((slot, i) => {
    if (imgs[i]) drawSlotWithFilter(ctx, imgs[i], slot, filter);
  });

  const frame = await loadFramePNG("strip");
  if (frame) ctx.drawImage(frame, 0, 0, CANVAS_W, CANVAS_H);

  // LAST: thin dashed cut line
  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = "rgba(150,150,150,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(620, 0);
  ctx.lineTo(620, CANVAS_H);
  ctx.stroke();
  ctx.restore();

  return canvasToBlob(canvas);
}

/** Layout B — full 4x6 portrait, 4 photos in 2x2. */
export async function renderLayoutB(photos: string[], filter: string = "none"): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const imgs = await Promise.all(photos.slice(0, 4).map(loadImg));
  FULL_SLOTS.forEach((slot, i) => {
    if (imgs[i]) drawSlotWithFilter(ctx, imgs[i], slot, filter);
  });
  const frame = await loadFramePNG("full");
  if (frame) ctx.drawImage(frame, 0, 0, CANVAS_W, CANVAS_H);
  return canvasToBlob(canvas);
}

/** Layout C — film strip (kept) */
export async function renderLayoutC(photos: string[], filter: string = "none"): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1844;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, 1240, 1844);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(40, 40, 1160, 1764);
  const imgs = await Promise.all(photos.slice(0, 4).map(loadImg));
  drawCoverFiltered(ctx, imgs[0], 40, 40, 1160, 380, filter);
  drawCoverFiltered(ctx, imgs[1], 40, 440, 1160, 380, filter);
  drawCoverFiltered(ctx, imgs[2], 40, 840, 1160, 380, filter);
  drawCoverFiltered(ctx, imgs[3], 40, 1240, 1160, 380, filter);
  ctx.save();
  ctx.font = "500 22px 'Noto Sans Thai', sans-serif";
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(WATERMARK, 620, 1720);
  ctx.restore();
  return canvasToBlob(canvas);
}

/** Layout D — GIF */
export async function renderLayoutD(photos: string[], filter: string = "none"): Promise<Blob> {
  const imgs = await Promise.all(photos.slice(0, 4).map(loadImg));
  const gif = new GIF({ workers: 2, quality: 10, width: 800, height: 600, workerScript: "/gif.worker.js" });
  for (const img of imgs) {
    const c = document.createElement("canvas");
    c.width = 800; c.height = 600;
    const cx = c.getContext("2d")!;
    cx.fillStyle = "#000";
    cx.fillRect(0, 0, 800, 600);
    drawSlotWithFilter(cx, img, { x: 0, y: 0, w: 800, h: 600 }, filter);
    gif.addFrame(c, { delay: 700 });
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

export async function renderLayout(layout: LayoutId, photos: string[], filter: string = "none"): Promise<Blob> {
  switch (layout) {
    case "A": return renderLayoutA(photos, filter);
    case "B": return renderLayoutB(photos, filter);
    case "C": return renderLayoutC(photos, filter);
    case "D": return renderLayoutD(photos, filter);
  }
}

export const LAYOUTS = [
  { id: "A" as const, label: "แบบแถบ 2x6 💑", emoji: "💑", desc: "ถ่าย 4 รูป ได้ 2 แถบตัดแบ่งได้", needsCount: 4, popular: true },
  { id: "B" as const, label: "เต็มแผ่น 4x6 🖼️", emoji: "🖼️", desc: "ถ่าย 4 รูป เต็มแผ่น", recommended: true, needsCount: 4 },
];
