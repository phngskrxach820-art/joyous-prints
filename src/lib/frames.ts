// Frame catalog — kiosk-local store of frame PNGs grouped by format.
// Filename convention:
//   frame_strip_{name}.png → Format A (2x6 strip)
//   frame_full_{name}.png  → Format B (full 4x6)
const KEY = "photobooth_frames_v1";

export type FormatId = "A" | "B";
export type Frame = {
  id: string;
  format: FormatId;
  filename: string;
  // dataURL OR public path. Empty string = placeholder.
  url: string;
};

const DEFAULTS: Frame[] = [
  { id: "strip-default", format: "A", filename: "frame_strip_default.png", url: "/frames/frame_strip_default.png" },
  { id: "full-default",  format: "B", filename: "frame_full_default.png",  url: "/frames/frame_full_default.png" },
];

export function loadFrames(): Frame[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const arr = JSON.parse(raw) as Frame[];
    return arr.length ? arr : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveFrames(frames: Frame[]) {
  localStorage.setItem(KEY, JSON.stringify(frames));
}

export function framesForFormat(format: FormatId): Frame[] {
  const prefix = format === "A" ? "frame_strip_" : "frame_full_";
  return loadFrames().filter((f) => f.filename.startsWith(prefix));
}

export function addFrame(format: FormatId, name: string, url: string): Frame {
  const safe = name.replace(/[^a-z0-9_-]/gi, "_").toLowerCase() || "frame";
  const prefix = format === "A" ? "frame_strip_" : "frame_full_";
  const filename = `${prefix}${safe}.png`;
  const f: Frame = { id: `${format}-${Date.now()}`, format, filename, url };
  const all = loadFrames();
  saveFrames([...all, f]);
  return f;
}

export function removeFrame(id: string) {
  saveFrames(loadFrames().filter((f) => f.id !== id));
}
