// Mapping between DesignId and the PNG frame file used during render and preview.
// If a custom design's PNG isn't present in /public/frames, we fall back to the
// per-format default frame so render never breaks.
import type { DesignId } from "@/components/PhotoboothOverlay";

export const DESIGN_FRAME_FILE: Record<DesignId, string> = {
  "strip-korean-mono":   "/frames/frame_strip_korean_mono.png",
  "strip-y2k-cyber":     "/frames/frame_strip_y2k_cyber.png",
  "strip-siam-marigold": "/frames/frame_strip_siam_marigold.png",
  "strip-bunny-cute":    "/frames/frame_strip_bunny_cute.png",
  "full-korean-cafe":    "/frames/frame_full_korean_cafe.png",
  "full-y2k-fairy":      "/frames/frame_full_y2k_fairy.png",
  "full-siam-sunset":    "/frames/frame_full_siam_sunset.png",
  "full-soft-pastel":    "/frames/frame_full_soft_pastel.png",
};

export function frameFallbackForDesign(designId: DesignId | undefined): string {
  if (designId && designId.startsWith("full")) return "/frames/frame_full_default.png";
  return "/frames/frame_strip_default.png";
}

export function frameUrlForDesign(designId: DesignId | undefined): {
  primary: string;
  fallback: string;
} {
  const fallback = frameFallbackForDesign(designId);
  const primary = designId ? (DESIGN_FRAME_FILE[designId] ?? fallback) : fallback;
  return { primary, fallback };
}

const _existsCache = new Map<string, boolean>();
export async function frameExists(url: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (_existsCache.has(url)) return _existsCache.get(url)!;
  const ok = await new Promise<boolean>((res) => {
    const img = new Image();
    img.onload = () => res(true);
    img.onerror = () => res(false);
    img.src = url;
  });
  _existsCache.set(url, ok);
  return ok;
}
