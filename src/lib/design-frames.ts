// Mapping between DesignId and the PNG frame file used during render and preview.
// If a custom design's PNG isn't present in /public/frames, we fall back to the
// per-format default frame so render never breaks.
//
// NOTE: There is no default frame for STRIP (2x6) anymore — only FULL (4x6)
// has a default fallback. Strip designs without a PNG render with no frame.
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

export function frameFallbackForDesign(designId: DesignId | undefined): string | null {
  if (designId && designId.startsWith("full")) return "/frames/frame_full_default.png";
  return null;
}

export function frameUrlForDesign(designId: DesignId | undefined): {
  primary: string | null;
  fallback: string | null;
} {
  const fallback = frameFallbackForDesign(designId);
  const primary = designId ? (DESIGN_FRAME_FILE[designId] ?? fallback) : fallback;
  return { primary, fallback };
}

const _existsCache = new Map<string, boolean>();
export async function frameExists(url: string | null | undefined): Promise<boolean> {
  if (!url) return false;
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
