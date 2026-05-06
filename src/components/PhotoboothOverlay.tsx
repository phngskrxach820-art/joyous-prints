import type { ReactNode } from "react";

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

export type FilterId = "none" | "softSkin" | "bw" | "warm" | "cool";

export const DESIGN_META: Record<
  DesignId,
  { label: string; emoji: string }
> = {
  "strip-classic": { label: "Classic Strip", emoji: "🎞️" },
  "strip-y2k-pink": { label: "Y2K Pink Strip", emoji: "💖" },
  "strip-pastel": { label: "Pastel Strip", emoji: "🌸" },
  "full-classic": { label: "Classic Full", emoji: "🖼️" },
  "full-y2k-pink": { label: "Y2K Pink Full", emoji: "💗" },
  "full-pastel": { label: "Pastel Full", emoji: "🌷" },
};

const FILTER_CSS: Record<FilterId, string> = {
  none: "none",
  softSkin: "saturate(1.05) contrast(0.98) brightness(1.04) blur(0.3px)",
  bw: "grayscale(1) contrast(1.05)",
  warm: "saturate(1.1) hue-rotate(-8deg) brightness(1.03)",
  cool: "saturate(1.05) hue-rotate(8deg) brightness(1.02)",
};

type Props = {
  design: DesignId;
  filter?: FilterId;
  children: ReactNode;
  className?: string;
};

/**
 * Empty Photobooth overlay shell.
 * Wraps a <video> (or any child) and applies a CSS filter.
 * Visual overlays (stickers, frames, gradients) can be added per-design later.
 */
export default function PhotoboothOverlay({
  design,
  filter = "none",
  children,
  className = "",
}: Props) {
  return (
    <div
      data-design={design}
      className={`relative w-full h-full overflow-hidden ${className}`}
    >
      <div
        className="w-full h-full"
        style={{ filter: FILTER_CSS[filter] }}
      >
        {children}
      </div>
      {/* TODO: per-design overlay layers go here */}
    </div>
  );
}
