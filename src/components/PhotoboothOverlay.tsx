// PhotoboothOverlay.tsx
// Heng Photobooth — 8 cute frame designs
// Y2K + Korean + Vintage Siam aesthetic
//
// 4 designs for 4x6 (FULL, 4 photo slots in 2x2 grid)
// 4 designs for 2x6 (STRIP, 3 photo slots stacked)
//
// All designs include IG logo + @hexjnyg at bottom
// All designs have transparent photo slots
//
// Drop into: src/components/PhotoboothOverlay.tsx

import React from "react";

// ═══════════════════════════════════════════════════════════════
// FILTERS — only 3 as requested
// ═══════════════════════════════════════════════════════════════

export const FILTERS = {
  none: "none",
  softSkin: "brightness(1.04) contrast(0.97) saturate(1.06)",
  vintage: "sepia(0.4) contrast(0.92) brightness(1.05) saturate(0.85) hue-rotate(-8deg)",
  blackWhite: "grayscale(1) contrast(1.05) brightness(1.02)",
} as const;

export type FilterKey = keyof typeof FILTERS;

export const FILTER_LABELS: Record<FilterKey, string> = {
  none: "ปกติ",
  softSkin: "Soft Skin ✨",
  vintage: "วินเทจ 🎞️",
  blackWhite: "ขาวดำ 🖤",
};

// ═══════════════════════════════════════════════════════════════
// DESIGN REGISTRY
// ═══════════════════════════════════════════════════════════════

export type DesignId =
  // 4x6 designs (1240 x 1844, 4 slots in 2x2 grid)
  | "full-korean-cafe"
  | "full-y2k-fairy"
  | "full-siam-sunset"
  | "full-soft-pastel"
  // 2x6 designs (600 x 1844, 3 slots stacked)
  | "strip-korean-mono"
  | "strip-y2k-cyber"
  | "strip-siam-marigold"
  | "strip-bunny-cute";

export type DesignFormat = "full" | "strip";

export interface DesignMeta {
  id: DesignId;
  label: string;
  labelThai: string;
  format: DesignFormat;
  emoji: string;
  bgColor: string;
  accentColor: string;
}

export const DESIGN_META: Record<DesignId, DesignMeta> = {
  "full-korean-cafe": {
    id: "full-korean-cafe",
    label: "Korean Cafe",
    labelThai: "คาเฟ่เกาหลี",
    format: "full",
    emoji: "☕",
    bgColor: "#F5EDE0",
    accentColor: "#8B6F47",
  },
  "full-y2k-fairy": {
    id: "full-y2k-fairy",
    label: "Y2K Fairy",
    labelThai: "Y2K แฟรี่",
    format: "full",
    emoji: "🧚",
    bgColor: "#FFE4F1",
    accentColor: "#FF6B9D",
  },
  "full-siam-sunset": {
    id: "full-siam-sunset",
    label: "Siam Sunset",
    labelThai: "สยามตะวันตก",
    format: "full",
    emoji: "🌅",
    bgColor: "#FFF3E0",
    accentColor: "#E07856",
  },
  "full-soft-pastel": {
    id: "full-soft-pastel",
    label: "Soft Pastel",
    labelThai: "พาสเทลฟุ้ง",
    format: "full",
    emoji: "🌸",
    bgColor: "#F0E6FF",
    accentColor: "#A584D9",
  },
  "strip-korean-mono": {
    id: "strip-korean-mono",
    label: "Korean Mono",
    labelThai: "เกาหลีโมโน",
    format: "strip",
    emoji: "🖤",
    bgColor: "#1A1A1A",
    accentColor: "#FFFFFF",
  },
  "strip-y2k-cyber": {
    id: "strip-y2k-cyber",
    label: "Y2K Cyber",
    labelThai: "Y2K ไซเบอร์",
    format: "strip",
    emoji: "💿",
    bgColor: "#1B0A3E",
    accentColor: "#00F5D4",
  },
  "strip-siam-marigold": {
    id: "strip-siam-marigold",
    label: "Siam Marigold",
    labelThai: "ดาวเรืองสยาม",
    format: "strip",
    emoji: "🌼",
    bgColor: "#FFF8DC",
    accentColor: "#D4A017",
  },
  "strip-bunny-cute": {
    id: "strip-bunny-cute",
    label: "Bunny Cute",
    labelThai: "บันนี่น่ารัก",
    format: "strip",
    emoji: "🐰",
    bgColor: "#FFEEF5",
    accentColor: "#FF80AB",
  },
};

export const ALL_DESIGNS: DesignId[] = Object.keys(DESIGN_META) as DesignId[];
export const FULL_DESIGNS: DesignId[] = ALL_DESIGNS.filter(
  (d) => DESIGN_META[d].format === "full"
);
export const STRIP_DESIGNS: DesignId[] = ALL_DESIGNS.filter(
  (d) => DESIGN_META[d].format === "strip"
);

// Decoration helpers removed — PNG overlays handle all decoration during
// canvas composition. Live preview now uses simple crop-guide SVGs only.

// ═══════════════════════════════════════════════════════════════
// FULL DESIGNS (1240 x 1844, 4 photo slots in 2x2)
// Photo slots: 4 invisible regions kept clear
//   (40, 140, 580, 870)   slot 1 — top left
//   (620, 140, 1160, 870) slot 2 — top right
//   (40, 910, 580, 1640)  slot 3 — bottom left
//   (620, 910, 1160, 1640) slot 4 — bottom right
//
// Decorations only on:
//   - Top header (y=0-130)
//   - Bottom footer (y=1660-1844)
//   - Outer rails (x=0-40 and x=1200-1240)
//   - Center gutter (x=580-620 and y=870-910)
// ═══════════════════════════════════════════════════════════════

// All decorative SVG removed — PNG overlays handle decoration during canvas
// composition. The live camera preview shows ONLY a dashed crop guide so the
// photographer can frame photos correctly.

const FullCropGuide: React.FC = () => (
  <svg
    viewBox="0 0 1240 1844"
    preserveAspectRatio="none"
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
  >
    {[
      [40, 140, 540, 730],
      [620, 140, 540, 730],
      [40, 910, 540, 730],
      [620, 910, 540, 730],
    ].map(([x, y, w, h], i) => (
      <rect
        key={i}
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2"
        strokeDasharray="8 4"
      />
    ))}
  </svg>
);

const StripCropGuide: React.FC = () => (
  <svg
    viewBox="0 0 600 1844"
    preserveAspectRatio="none"
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
  >
    {[
      [40, 140, 520, 490],
      [40, 650, 520, 490],
      [40, 1160, 520, 490],
    ].map(([x, y, w, h], i) => (
      <rect
        key={i}
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2"
        strokeDasharray="8 4"
      />
    ))}
  </svg>
);

const FullKoreanCafe = FullCropGuide;
const FullY2KFairy = FullCropGuide;
const FullSiamSunset = FullCropGuide;
const FullSoftPastel = FullCropGuide;
const StripKoreanMono = StripCropGuide;
const StripY2KCyber = StripCropGuide;
const StripSiamMarigold = StripCropGuide;
const StripBunnyCute = StripCropGuide;


// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const FRAME_RENDERERS: Record<DesignId, React.FC> = {
  "full-korean-cafe": FullKoreanCafe,
  "full-y2k-fairy": FullY2KFairy,
  "full-siam-sunset": FullSiamSunset,
  "full-soft-pastel": FullSoftPastel,
  "strip-korean-mono": StripKoreanMono,
  "strip-y2k-cyber": StripY2KCyber,
  "strip-siam-marigold": StripSiamMarigold,
  "strip-bunny-cute": StripBunnyCute,
};

export interface PhotoboothOverlayProps {
  design: DesignId;
  filter?: FilterKey;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const PhotoboothOverlay: React.FC<PhotoboothOverlayProps> = ({
  design,
  filter = "none",
  children,
  className = "",
  style,
}) => {
  const FrameComponent = FRAME_RENDERERS[design];
  const filterStr = FILTERS[filter];
  const meta = DESIGN_META[design];
  const aspect = meta.format === "full" ? 1240 / 1844 : 600 / 1844;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: aspect, ...style }}>
      <div className="absolute inset-0" style={{ filter: filterStr }}>
        {children}
      </div>
      {FrameComponent && <FrameComponent />}
    </div>
  );
};

export default PhotoboothOverlay;
