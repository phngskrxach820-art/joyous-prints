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

/** Layout A — แบ่งให้เพื่อน — 1240x1844 portrait, 2 identical strips side by side, cut line in middle */
export async function renderLayoutA(photos: string[]): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1844;
  const ctx = canvas.getContext("2d")!;

  // White background outside strips
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 1240, 1844);

  const imgs = await Promise.all(photos.slice(0, 4).map(loadImg));

  // Optional frame overlay (600x1844 per strip)
  let frame: HTMLImageElement | null = null;
  try {
    frame = await loadImg("/frame_default.png");
  } catch {
    frame = null;
  }

  // Photo area inside each strip — leaves room for header logo + bottom badge
  const HEADER_H = 220;
  const FOOTER_H = 180;
  const photoTop = HEADER_H;
  const photoBottom = 1844 - FOOTER_H;
  const photoArea = photoBottom - photoTop;
  const slotGap = 12;
  const slotH = (photoArea - slotGap * 3) / 4;

  // Draw a single strip (photos behind, frame on top)
  function drawStrip(xOffset: number, stripW: number) {
    // Strip background (subtle dark behind photos to show through any frame transparency)
    ctx.fillStyle = "#111111";
    ctx.fillRect(xOffset, 0, stripW, 1844);

    // 4 photos stacked
    for (let i = 0; i < 4; i++) {
      const y = photoTop + i * (slotH + slotGap);
      drawCover(ctx, imgs[i % imgs.length], xOffset + 20, y, stripW - 40, slotH);
    }

    // Frame overlay on top
    if (frame) {
      ctx.drawImage(frame, xOffset, 0, stripW, 1844);
    } else {
      // Fallback: draw simple branded header + footer placeholders so output still looks intentional
      ctx.fillStyle = "rgba(20,30,70,0.95)";
      ctx.fillRect(xOffset + 20, 30, stripW - 40, HEADER_H - 50);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 26px 'Noto Sans Thai', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PHOTOBOOTH BY HENG", xOffset + stripW / 2, 30 + (HEADER_H - 50) / 2 - 18);
      ctx.font = "bold 22px 'Noto Sans Thai', sans-serif";
      ctx.fillText("เฮงที่ชอบพกกล้องมาวิทยาลัย", xOffset + stripW / 2, 30 + (HEADER_H - 50) / 2 + 16);

      // bottom badge
      ctx.fillStyle = "rgba(20,30,70,0.9)";
      ctx.fillRect(xOffset + 20, 1844 - FOOTER_H + 30, stripW - 40, FOOTER_H - 60);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "500 18px 'Noto Sans Thai', sans-serif";
      ctx.fillText("HENG'S PHOTO BOOTH · IG: HENGSPHOTO", xOffset + stripW / 2, 1844 - FOOTER_H / 2);
    }
  }

  drawStrip(0, 600);
  drawStrip(640, 600);

  // Center cut line — dashed white with scissors icon
  ctx.save();
  ctx.strokeStyle = "rgba(150,150,150,0.9)";
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(620, 0);
  ctx.lineTo(620, 1844);
  ctx.stroke();
  ctx.restore();
  // Scissors icon at top
  ctx.font = "28px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(80,80,80,0.95)";
  ctx.fillText("✂️", 620, 6);

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
  { id: "A" as const, label: "แบ่งให้เพื่อน", emoji: "✂️", desc: "2 แถบเหมือนกัน ตัดแบ่งเก็บกับให้เพื่อน", needsCount: 4 },
  { id: "B" as const, label: "เต็มแผ่น 4x6", emoji: "⭐", desc: "คอลลาจ 4 รูปในแผ่นเดียว", recommended: true, needsCount: 4 },
  { id: "C" as const, label: "ฟิล์มสตริป", emoji: "🎞️", desc: "สไตล์ตู้โฟโต้บูธคลาสสิก", needsCount: 4 },
];
