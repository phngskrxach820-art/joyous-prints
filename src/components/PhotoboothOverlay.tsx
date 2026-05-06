import type { CSSProperties, ReactNode } from "react";

export const STRIP_DESIGNS = [
  "strip-classic",
  "strip-y2k-pink",
  "strip-pastel",
] as const;

export const FULL_DESIGNS = [
  "full-classic",
  "full-y2k-pink",
  "full-pastel",
] as const;

export type StripDesignId = (typeof STRIP_DESIGNS)[number];
export type FullDesignId = (typeof FULL_DESIGNS)[number];
export type DesignId = StripDesignId | FullDesignId;

export const DESIGN_META: Record<DesignId, { label: string; emoji: string }> = {
  "strip-classic": { label: "Classic Strip", emoji: "🎞️" },
  "strip-y2k-pink": { label: "Y2K Pink Strip", emoji: "💖" },
  "strip-pastel": { label: "Pastel Strip", emoji: "🌸" },
  "full-classic": { label: "Classic Full", emoji: "🖼️" },
  "full-y2k-pink": { label: "Y2K Pink Full", emoji: "💗" },
  "full-pastel": { label: "Pastel Full", emoji: "🌷" },
};

/** Filter keys + CSS values shared by preview, live camera, and final render. */
export const FILTERS = {
  none: "none",
  softSkin: "saturate(1.05) contrast(0.98) brightness(1.04)",
  bw: "grayscale(1) contrast(1.05)",
  warm: "saturate(1.1) sepia(0.15) brightness(1.03)",
  cool: "saturate(1.05) hue-rotate(-12deg) brightness(1.02)",
} as const;

export type FilterKey = keyof typeof FILTERS;
/** @deprecated use FilterKey */
export type FilterId = FilterKey;

export const FILTER_LABELS: Record<FilterKey, string> = {
  none: "ปกติ",
  softSkin: "ผิวนุ่ม 🌸",
  bw: "ขาวดำ 🖤",
  warm: "อบอุ่น 🔆",
  cool: "เย็นตา ❄️",
};

export const FILTER_ORDER: FilterKey[] = ["none", "softSkin", "bw", "warm", "cool"];

type Props = {
  design: DesignId;
  filter?: FilterKey;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Photobooth overlay shell. Wraps a child (video / image / placeholder)
 * and applies a CSS filter. Per-design SVG art layers can be added later.
 */
export default function PhotoboothOverlay({
  design,
  filter = "none",
  children,
  className = "",
  style,
}: Props) {
  return (
    <div
      data-design={design}
      style={style}
      className={`relative w-full h-full overflow-hidden ${className}`}
    >
      <div className="w-full h-full" style={{ filter: FILTERS[filter] }}>
        {children}
      </div>
      {/* TODO: per-design SVG overlay layers */}
    </div>
  );
}
