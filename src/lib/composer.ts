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

function drawCoverFiltered(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  filter: string,
) {
  const prev = ctx.filter;
  ctx.filter = filter || "none";
  drawCover(ctx, img, x, y, w, h);
  ctx.filter = prev;
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

async function loadFrame(): Promise<HTMLImageElement | null> {
  // Try the canonical admin upload path first, then legacy fallback
  const candidates = ["/frames/frame_default.png", "/frame_default.png"];
  for (const src of candidates) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = "anonymous";
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = src;
      });
      return img;
    } catch {
      // try next
    }
  }
  return null;
}

type Slot = { x: number; y: number; w: number; h: number; shape: "oval" | "rect" };

const STRIP_SLOTS: Slot[] = [
  { x: 80,  y: 252,  w: 440, h: 237, shape: "oval" },
  { x: 80,  y: 535,  w: 440, h: 259, shape: "rect" },
  { x: 80,  y: 840,  w: 440, h: 237, shape: "oval" },
  { x: 80,  y: 1124, w: 439, h: 259, shape: "rect" },
  { x: 700, y: 253,  w: 440, h: 237, shape: "oval" },
  { x: 700, y: 536,  w: 439, h: 259, shape: "rect" },
  { x: 700, y: 842,  w: 440, h: 236, shape: "oval" },
  { x: 700, y: 1125, w: 439, h: 259, shape: "rect" },
];

async function loadStripFrame(): Promise<HTMLImageElement | null> {
  try {
    return await loadImg("/frames/frame_strip_default.png");
  } catch {
    return null;
  }
}

function drawSlotShape(ctx: CanvasRenderingContext2D, slot: Slot) {
  ctx.beginPath();
  if (slot.shape === "oval") {
    const cx = slot.x + slot.w / 2;
    const cy = slot.y + slot.h / 2;
    ctx.ellipse(cx, cy, slot.w / 2, slot.h / 2, 0, 0, Math.PI * 2);
  } else {
    const r = 12;
    const { x, y, w, h } = slot;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

/** Layout A — 2x6 strip with booth1 frame, 8 slots (4 photos x 2 columns) */
export async function renderLayoutA(photos: string[], filter: string = "none"): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1844;
  const ctx = canvas.getContext("2d")!;

  // 1. White background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 1240, 1844);

  const imgs = await Promise.all(photos.slice(0, 4).map(loadImg));
  const frame = await loadStripFrame();

  // 2. Draw photos into slots (left: 1-4, right: 1-4)
  STRIP_SLOTS.forEach((slot, i) => {
    const photo = imgs[i % 4];
    ctx.save();
    drawSlotShape(ctx, slot);
    ctx.clip();
    ctx.filter = filter || "none";
    // object-fit cover
    const ratio = Math.max(slot.w / photo.width, slot.h / photo.height);
    const nw = photo.width * ratio;
    const nh = photo.height * ratio;
    const ox = slot.x + (slot.w - nw) / 2;
    const oy = slot.y + (slot.h - nh) / 2;
    ctx.drawImage(photo, ox, oy, nw, nh);
    ctx.restore();
  });

  // 3. Draw frame PNG on top
  if (frame) {
    ctx.drawImage(frame, 0, 0, 1240, 1844);
  }

  return canvasToBlob(canvas, "image/jpeg", 1.0);
}

/** Layout B — เต็มแผ่น 4x6 — 1844x1240 landscape, 4 portrait photos in a row */
export async function renderLayoutB(photos: string[], filter: string = "none"): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1844;
  canvas.height = 1240;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 1844, 1240);
  const imgs = await Promise.all(photos.slice(0, 4).map(loadImg));
  // 4 portrait slots in a row. Sheet 1844x1240. Margins + gaps.
  const marginX = 30;
  const marginY = 40;
  const footerH = 100;
  const gap = 16;
  const slotW = (1844 - marginX * 2 - gap * 3) / 4; // ~437
  const slotH = 1240 - marginY * 2 - footerH;       // ~1060
  for (let i = 0; i < 4; i++) {
    const x = marginX + i * (slotW + gap);
    drawCoverFiltered(ctx, imgs[i], x, marginY, slotW, slotH, filter);
  }
  // Watermark dark on white
  ctx.save();
  ctx.font = "500 22px 'Noto Sans Thai', sans-serif";
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(WATERMARK, 1820, 1225);
  ctx.restore();
  // Frame overlay LAST (transparent PNG, full sheet)
  const frame = await loadFrame();
  if (frame) {
    ctx.drawImage(frame, 0, 0, 1844, 1240);
  } else {
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 1840, 1236);
  }
  return canvasToBlob(canvas);
}

/** Layout C — ฟิล์มสตริป — 1240x1844 portrait */
export async function renderLayoutC(photos: string[], filter: string = "none"): Promise<Blob> {
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
  drawCoverFiltered(ctx, imgs[0], 40, 40, 1160, 380, filter);
  drawCoverFiltered(ctx, imgs[1], 40, 440, 1160, 380, filter);
  drawCoverFiltered(ctx, imgs[2], 40, 840, 1160, 380, filter);
  drawCoverFiltered(ctx, imgs[3], 40, 1240, 1160, 380, filter);
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
export async function renderLayoutD(photos: string[], filter: string = "none"): Promise<Blob> {
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
    drawCoverFiltered(cx, img, 0, 0, 800, 600, filter);
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

export async function renderLayout(layout: LayoutId, photos: string[], filter: string = "none"): Promise<Blob> {
  switch (layout) {
    case "A": return renderLayoutA(photos, filter);
    case "B": return renderLayoutB(photos, filter);
    case "C": return renderLayoutC(photos, filter);
    case "D": return renderLayoutD(photos, filter);
  }
}

export const LAYOUTS = [
  { id: "A" as const, label: "แบ่งให้เพื่อน 💑 (2x6)", emoji: "💑", desc: "ถ่าย 3 รูป ได้ 2 แถบเหมือนกันบนกระดาษ 4x6 แบ่งกับเพื่อนได้เลย", needsCount: 3 },
  { id: "B" as const, label: "เต็มแผ่น 4x6 🖼️", emoji: "🖼️", desc: "ถ่าย 4 รูป เต็มแผ่น 4x6", recommended: true, needsCount: 4 },
];
