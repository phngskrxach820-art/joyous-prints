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
  softSkin: "blur(0.3px) brightness(1.03) contrast(0.98) saturate(1.04)",
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

// ═══════════════════════════════════════════════════════════════
// IG LOGO + HEXJNYG SIGNATURE — used in all designs
// ═══════════════════════════════════════════════════════════════

const IGSignature: React.FC<{
  cx: number;
  cy: number;
  scale?: number;
  textColor?: string;
}> = ({ cx, cy, scale = 1, textColor = "#fff" }) => {
  // Instagram-style camera icon + hexjnyg text, NOT touching but close
  const s = scale;
  const iconSize = 28 * s;
  const gap = 14 * s; // gap between icon and text (close but not touching)
  const textOffset = iconSize / 2 + gap;

  return (
    <g transform={`translate(${cx},${cy})`}>
      {/* IG icon — rounded square with circle */}
      <rect
        x={-iconSize / 2 - textOffset / 2 + textOffset / 2 - iconSize}
        y={-iconSize / 2}
        width={iconSize}
        height={iconSize}
        rx={iconSize * 0.22}
        fill="none"
        stroke={textColor}
        strokeWidth={2.5 * s}
      />
      <circle
        cx={-textOffset / 2 - iconSize / 2}
        cy={0}
        r={iconSize * 0.32}
        fill="none"
        stroke={textColor}
        strokeWidth={2.5 * s}
      />
      <circle
        cx={-textOffset / 2 - iconSize / 2 + iconSize * 0.28}
        cy={-iconSize * 0.28}
        r={iconSize * 0.06}
        fill={textColor}
      />
      {/* hexjnyg text */}
      <text
        x={textOffset / 2}
        y={iconSize * 0.18}
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="700"
        fontSize={22 * s}
        fill={textColor}
      >
        hexjnyg
      </text>
    </g>
  );
};

// ═══════════════════════════════════════════════════════════════
// DECORATION HELPERS
// ═══════════════════════════════════════════════════════════════

const Star: React.FC<{ x: number; y: number; size?: number; fill?: string }> = ({
  x,
  y,
  size = 18,
  fill = "#FFD93D",
}) => (
  <path
    d={`M${x},${y - size} L${x + size * 0.3},${y - size * 0.3} L${x + size},${y - size * 0.3} L${x + size * 0.45},${y + size * 0.15} L${x + size * 0.6},${y + size} L${x},${y + size * 0.55} L${x - size * 0.6},${y + size} L${x - size * 0.45},${y + size * 0.15} L${x - size},${y - size * 0.3} L${x - size * 0.3},${y - size * 0.3} Z`}
    fill={fill}
    stroke="#000"
    strokeWidth="1.5"
  />
);

const Heart: React.FC<{ x: number; y: number; size?: number; fill?: string }> = ({
  x,
  y,
  size = 18,
  fill = "#FF4F8B",
}) => (
  <path
    d={`M${x},${y + size * 0.7} C${x},${y + size * 0.7} ${x - size * 1.2},${y - size * 0.1} ${x - size * 1.2},${y - size * 0.6} C${x - size * 1.2},${y - size} ${x - size * 0.6},${y - size * 1.1} ${x - size * 0.3},${y - size * 0.85} C${x - size * 0.1},${y - size * 0.65} ${x},${y - size * 0.4} ${x},${y - size * 0.2} C${x},${y - size * 0.4} ${x + size * 0.1},${y - size * 0.65} ${x + size * 0.3},${y - size * 0.85} C${x + size * 0.6},${y - size * 1.1} ${x + size * 1.2},${y - size} ${x + size * 1.2},${y - size * 0.6} C${x + size * 1.2},${y - size * 0.1} ${x},${y + size * 0.7} ${x},${y + size * 0.7} Z`}
    fill={fill}
    stroke="#000"
    strokeWidth="1.2"
  />
);

const Sparkle: React.FC<{ x: number; y: number; size?: number; fill?: string }> = ({
  x,
  y,
  size = 12,
  fill = "#FFFFFF",
}) => (
  <path
    d={`M${x},${y - size} L${x + size * 0.25},${y - size * 0.25} L${x + size},${y} L${x + size * 0.25},${y + size * 0.25} L${x},${y + size} L${x - size * 0.25},${y + size * 0.25} L${x - size},${y} L${x - size * 0.25},${y - size * 0.25} Z`}
    fill={fill}
  />
);

const Marigold: React.FC<{ x: number; y: number; size?: number }> = ({
  x,
  y,
  size = 22,
}) => (
  <g transform={`translate(${x},${y})`}>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <ellipse
        key={deg}
        cx="0"
        cy={-size * 0.45}
        rx={size * 0.22}
        ry={size * 0.45}
        fill="#FF8C00"
        stroke="#8B4513"
        strokeWidth="1"
        transform={`rotate(${deg})`}
      />
    ))}
    <circle cx="0" cy="0" r={size * 0.28} fill="#D4A017" stroke="#8B4513" strokeWidth="1.2" />
  </g>
);

const Bunny: React.FC<{ x: number; y: number; size?: number }> = ({ x, y, size = 16 }) => (
  <g transform={`translate(${x},${y})`}>
    {/* ears */}
    <ellipse cx={-size * 0.3} cy={-size * 0.8} rx={size * 0.18} ry={size * 0.5} fill="#fff" stroke="#000" strokeWidth="1.2" />
    <ellipse cx={size * 0.3} cy={-size * 0.8} rx={size * 0.18} ry={size * 0.5} fill="#fff" stroke="#000" strokeWidth="1.2" />
    <ellipse cx={-size * 0.3} cy={-size * 0.8} rx={size * 0.08} ry={size * 0.3} fill="#FFB6C1" />
    <ellipse cx={size * 0.3} cy={-size * 0.8} rx={size * 0.08} ry={size * 0.3} fill="#FFB6C1" />
    {/* head */}
    <circle cx="0" cy={size * 0.1} r={size * 0.55} fill="#fff" stroke="#000" strokeWidth="1.2" />
    {/* eyes */}
    <circle cx={-size * 0.18} cy={size * 0.05} r={size * 0.07} fill="#000" />
    <circle cx={size * 0.18} cy={size * 0.05} r={size * 0.07} fill="#000" />
    {/* nose */}
    <ellipse cx="0" cy={size * 0.25} rx={size * 0.08} ry={size * 0.05} fill="#FFB6C1" />
  </g>
);

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

const FullKoreanCafe: React.FC = () => (
  <svg viewBox="0 0 1240 1844" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
    {/* Top header */}
    <rect x="0" y="0" width="1240" height="130" fill="#F5EDE0" />
    <rect x="0" y="0" width="1240" height="6" fill="#8B6F47" />
    <text x="620" y="60" textAnchor="middle" fontFamily="serif" fontWeight="700" fontSize="44" fill="#8B6F47">
      heng photobooth
    </text>
    <text x="620" y="100" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize="24" fill="#A0826D">
      ☕ good day, good vibes ☕
    </text>

    {/* Coffee bean decorations */}
    <ellipse cx="100" cy="60" rx="14" ry="22" fill="#6B4423" stroke="#000" strokeWidth="1.5" />
    <path d="M100,38 Q100,60 100,82" stroke="#000" strokeWidth="1.5" fill="none" />
    <ellipse cx="1140" cy="60" rx="14" ry="22" fill="#6B4423" stroke="#000" strokeWidth="1.5" />
    <path d="M1140,38 Q1140,60 1140,82" stroke="#000" strokeWidth="1.5" fill="none" />

    {/* Side rails */}
    <rect x="0" y="130" width="40" height="1530" fill="#F5EDE0" />
    <rect x="1200" y="130" width="40" height="1530" fill="#F5EDE0" />

    {/* Center gutter */}
    <rect x="580" y="130" width="40" height="1530" fill="#F5EDE0" />
    <rect x="0" y="870" width="1240" height="40" fill="#F5EDE0" />

    {/* Slot frames — thin elegant borders */}
    {[
      [40, 140, 580, 870],
      [620, 140, 1160, 870],
      [40, 910, 580, 1640],
      [620, 910, 1160, 1640],
    ].map(([x1, y1, x2, y2], i) => (
      <rect key={i} x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="none" stroke="#8B6F47" strokeWidth="2" />
    ))}

    {/* Bottom footer */}
    <rect x="0" y="1660" width="1240" height="184" fill="#F5EDE0" />
    <rect x="0" y="1838" width="1240" height="6" fill="#8B6F47" />
    <text x="620" y="1710" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize="22" fill="#A0826D">
      ✦ moments to remember ✦
    </text>
    <IGSignature cx={620} cy={1780} scale={1.1} textColor="#8B6F47" />
  </svg>
);

const FullY2KFairy: React.FC = () => (
  <svg viewBox="0 0 1240 1844" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
    {/* Pink gradient header */}
    <defs>
      <linearGradient id="pink-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FF6B9D" />
        <stop offset="100%" stopColor="#FFB6D9" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="1240" height="130" fill="url(#pink-grad)" />
    <text x="620" y="65" textAnchor="middle" fontFamily="cursive" fontWeight="900" fontSize="50" fill="#fff" stroke="#FF1493" strokeWidth="2">
      ♡ Heng Photobooth ♡
    </text>
    <text x="620" y="105" textAnchor="middle" fontFamily="cursive" fontSize="24" fill="#fff">
      ✧ y2k fairy vibes ✧
    </text>

    {/* Stars on header */}
    <Star x={80} y={50} size={20} fill="#FFD93D" />
    <Star x={1160} y={50} size={20} fill="#FFD93D" />
    <Sparkle x={150} y={40} size={10} fill="#fff" />
    <Sparkle x={1090} y={40} size={10} fill="#fff" />

    {/* Background fill */}
    <rect x="0" y="130" width="40" height="1530" fill="#FFE4F1" />
    <rect x="1200" y="130" width="40" height="1530" fill="#FFE4F1" />
    <rect x="580" y="130" width="40" height="1530" fill="#FFE4F1" />
    <rect x="0" y="870" width="1240" height="40" fill="#FFE4F1" />

    {/* Slot borders — pink dashed */}
    {[
      [40, 140, 580, 870],
      [620, 140, 1160, 870],
      [40, 910, 580, 1640],
      [620, 910, 1160, 1640],
    ].map(([x1, y1, x2, y2], i) => (
      <rect key={i} x={x1 + 4} y={y1 + 4} width={x2 - x1 - 8} height={y2 - y1 - 8} fill="none" stroke="#FF6B9D" strokeWidth="3" strokeDasharray="8 4" />
    ))}

    {/* Hearts on rails */}
    {[400, 700, 1100, 1400].map((y, i) => (
      <g key={i}>
        <Heart x={20} y={y} size={14} fill="#FF4F8B" />
        <Heart x={1220} y={y + 100} size={14} fill="#FF4F8B" />
      </g>
    ))}

    {/* Sparkles on center gutter */}
    {[300, 500, 1000, 1200, 1400].map((y, i) => (
      <Sparkle key={i} x={600} y={y} size={12} fill="#FF6B9D" />
    ))}

    {/* Bottom footer */}
    <rect x="0" y="1660" width="1240" height="184" fill="url(#pink-grad)" />
    <Star x={120} y={1730} size={18} fill="#FFD93D" />
    <Star x={1120} y={1730} size={18} fill="#FFD93D" />
    <text x="620" y="1730" textAnchor="middle" fontFamily="cursive" fontSize="24" fill="#fff" fontStyle="italic">
      ✦ stay sparkly ✦
    </text>
    <IGSignature cx={620} cy={1790} scale={1.1} textColor="#fff" />
  </svg>
);

const FullSiamSunset: React.FC = () => (
  <svg viewBox="0 0 1240 1844" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
    {/* Sunset gradient header */}
    <defs>
      <linearGradient id="sunset-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E07856" />
        <stop offset="100%" stopColor="#FFB088" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="1240" height="130" fill="url(#sunset-grad)" />
    <text x="620" y="62" textAnchor="middle" fontFamily="serif" fontWeight="900" fontSize="46" fill="#fff" stroke="#8B3A1C" strokeWidth="1.5">
      เฮง Photobooth
    </text>
    <text x="620" y="100" textAnchor="middle" fontFamily="serif" fontSize="22" fill="#FFF3E0" fontStyle="italic">
      ✦ สยามสไตล์ · vintage tones ✦
    </text>

    {/* Sun decoration */}
    <circle cx="100" cy="60" r="25" fill="#FFD93D" stroke="#8B3A1C" strokeWidth="2" />
    <circle cx="1140" cy="60" r="25" fill="#FFD93D" stroke="#8B3A1C" strokeWidth="2" />

    {/* Cream fill */}
    <rect x="0" y="130" width="40" height="1530" fill="#FFF3E0" />
    <rect x="1200" y="130" width="40" height="1530" fill="#FFF3E0" />
    <rect x="580" y="130" width="40" height="1530" fill="#FFF3E0" />
    <rect x="0" y="870" width="1240" height="40" fill="#FFF3E0" />

    {/* Slot borders — double line */}
    {[
      [40, 140, 580, 870],
      [620, 140, 1160, 870],
      [40, 910, 580, 1640],
      [620, 910, 1160, 1640],
    ].map(([x1, y1, x2, y2], i) => (
      <g key={i}>
        <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="none" stroke="#E07856" strokeWidth="2" />
        <rect x={x1 + 8} y={y1 + 8} width={x2 - x1 - 16} height={y2 - y1 - 16} fill="none" stroke="#E07856" strokeWidth="1" />
      </g>
    ))}

    {/* Marigold flowers on rails (Thai vibes) */}
    <Marigold x={20} y={400} size={20} />
    <Marigold x={1220} y={550} size={20} />
    <Marigold x={20} y={1100} size={20} />
    <Marigold x={1220} y={1300} size={20} />

    {/* Bottom */}
    <rect x="0" y="1660" width="1240" height="184" fill="url(#sunset-grad)" />
    <text x="620" y="1720" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize="22" fill="#fff">
      ✦ ความทรงจำดีๆ ที่นี่ ✦
    </text>
    <IGSignature cx={620} cy={1785} scale={1.1} textColor="#fff" />
  </svg>
);

const FullSoftPastel: React.FC = () => (
  <svg viewBox="0 0 1240 1844" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
    <rect x="0" y="0" width="1240" height="130" fill="#F0E6FF" />
    <rect x="0" y="0" width="1240" height="4" fill="#A584D9" />

    {/* Cherry blossom petals on header corners */}
    {[
      { x: 80, y: 60, r: 0 },
      { x: 130, y: 90, r: 30 },
      { x: 1110, y: 60, r: -30 },
      { x: 1160, y: 90, r: 0 },
    ].map((p, i) => (
      <g key={i} transform={`translate(${p.x},${p.y}) rotate(${p.r})`}>
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-12"
            rx="6"
            ry="12"
            fill="#FFC8DD"
            stroke="#A584D9"
            strokeWidth="0.8"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle cx="0" cy="0" r="3.5" fill="#FFE5B4" />
      </g>
    ))}

    <text x="620" y="65" textAnchor="middle" fontFamily="cursive" fontWeight="700" fontSize="46" fill="#7F5DAA">
      ✿ heng photobooth ✿
    </text>
    <text x="620" y="105" textAnchor="middle" fontFamily="cursive" fontSize="22" fill="#A584D9" fontStyle="italic">
      soft & dreamy moments
    </text>

    {/* Pastel fill */}
    <rect x="0" y="130" width="40" height="1530" fill="#F0E6FF" />
    <rect x="1200" y="130" width="40" height="1530" fill="#F0E6FF" />
    <rect x="580" y="130" width="40" height="1530" fill="#F0E6FF" />
    <rect x="0" y="870" width="1240" height="40" fill="#F0E6FF" />

    {/* Slot borders — soft purple rounded */}
    {[
      [40, 140, 580, 870],
      [620, 140, 1160, 870],
      [40, 910, 580, 1640],
      [620, 910, 1160, 1640],
    ].map(([x1, y1, x2, y2], i) => (
      <rect key={i} x={x1 + 6} y={y1 + 6} width={x2 - x1 - 12} height={y2 - y1 - 12} rx="14" fill="none" stroke="#A584D9" strokeWidth="2.5" />
    ))}

    {/* Pastel hearts on rails */}
    {[400, 700, 1100, 1400].map((y, i) => (
      <g key={i}>
        <Heart x={20} y={y} size={14} fill="#FFC8DD" />
        <Heart x={1220} y={y + 100} size={14} fill="#A0E7E5" />
      </g>
    ))}

    {/* Petals scattered on center */}
    {[300, 600, 1100, 1500].map((y, i) => (
      <ellipse key={i} cx="600" cy={y} rx="8" ry="14" fill="#FFC8DD" stroke="#A584D9" strokeWidth="1" transform={`rotate(${i * 45} 600 ${y})`} />
    ))}

    {/* Bottom */}
    <rect x="0" y="1660" width="1240" height="184" fill="#F0E6FF" />
    <rect x="0" y="1840" width="1240" height="4" fill="#A584D9" />
    <text x="620" y="1720" textAnchor="middle" fontFamily="cursive" fontSize="22" fill="#7F5DAA" fontStyle="italic">
      ✿ stay soft, friend ✿
    </text>
    <IGSignature cx={620} cy={1785} scale={1.1} textColor="#7F5DAA" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// STRIP DESIGNS (600 x 1844, 3 photo slots stacked)
// Photo slots:
//   (40, 140, 560, 690)   slot 1
//   (40, 720, 560, 1270)  slot 2
//   (40, 1300, 560, 1640) slot 3
// ═══════════════════════════════════════════════════════════════

const StripKoreanMono: React.FC = () => (
  <svg viewBox="0 0 600 1844" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
    <rect x="0" y="0" width="600" height="130" fill="#1A1A1A" />
    <text x="300" y="55" textAnchor="middle" fontFamily="serif" fontWeight="700" fontSize="34" fill="#fff">
      heng photobooth
    </text>
    <text x="300" y="95" textAnchor="middle" fontFamily="serif" fontSize="18" fill="#aaa" fontStyle="italic">
      monochrome moments
    </text>

    {/* Side rails */}
    <rect x="0" y="130" width="40" height="1530" fill="#1A1A1A" />
    <rect x="560" y="130" width="40" height="1530" fill="#1A1A1A" />

    {/* Slot gutters */}
    <rect x="0" y="690" width="600" height="30" fill="#1A1A1A" />
    <rect x="0" y="1270" width="600" height="30" fill="#1A1A1A" />

    {/* Slot numbers (Korean-style) */}
    <text x="55" y="170" fontFamily="monospace" fontSize="16" fill="#fff">01</text>
    <text x="55" y="750" fontFamily="monospace" fontSize="16" fill="#fff">02</text>
    <text x="55" y="1330" fontFamily="monospace" fontSize="16" fill="#fff">03</text>

    {/* Decorative lines */}
    <line x1="60" y1="180" x2="540" y2="180" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
    <line x1="60" y1="760" x2="540" y2="760" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
    <line x1="60" y1="1340" x2="540" y2="1340" stroke="#fff" strokeWidth="0.5" opacity="0.3" />

    {/* Bottom */}
    <rect x="0" y="1660" width="600" height="184" fill="#1A1A1A" />
    <text x="300" y="1720" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize="18" fill="#aaa">
      ✦ keep it simple ✦
    </text>
    <IGSignature cx={300} cy={1785} scale={1} textColor="#fff" />
  </svg>
);

const StripY2KCyber: React.FC = () => (
  <svg viewBox="0 0 600 1844" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
    <defs>
      <linearGradient id="cyber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1B0A3E" />
        <stop offset="100%" stopColor="#3D1B6F" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="600" height="130" fill="url(#cyber-grad)" />

    {/* Glitch-style title */}
    <text x="300" y="60" textAnchor="middle" fontFamily="monospace" fontWeight="900" fontSize="32" fill="#00F5D4">
      ★ HENG ★ PHOTO ★
    </text>
    <text x="300" y="100" textAnchor="middle" fontFamily="monospace" fontSize="16" fill="#FF6B9D">
      &gt;&gt; cyber booth Y2K &lt;&lt;
    </text>

    {/* Side rails with neon */}
    <rect x="0" y="130" width="40" height="1530" fill="url(#cyber-grad)" />
    <rect x="560" y="130" width="40" height="1530" fill="url(#cyber-grad)" />
    <line x1="40" y1="130" x2="40" y2="1660" stroke="#00F5D4" strokeWidth="2" />
    <line x1="560" y1="130" x2="560" y2="1660" stroke="#00F5D4" strokeWidth="2" />

    {/* Slot gutters with cyber dividers */}
    <rect x="0" y="690" width="600" height="30" fill="url(#cyber-grad)" />
    <rect x="0" y="1270" width="600" height="30" fill="url(#cyber-grad)" />
    <line x1="60" y1="705" x2="540" y2="705" stroke="#FF6B9D" strokeWidth="1" strokeDasharray="6 4" />
    <line x1="60" y1="1285" x2="540" y2="1285" stroke="#FF6B9D" strokeWidth="1" strokeDasharray="6 4" />

    {/* CD/disc decorations on rails */}
    {[280, 980, 1500].map((y, i) => (
      <g key={i}>
        <circle cx="20" cy={y} r="14" fill="#00F5D4" stroke="#fff" strokeWidth="1" />
        <circle cx="20" cy={y} r="5" fill="#1B0A3E" />
        <circle cx="580" cy={y + 100} r="14" fill="#FF6B9D" stroke="#fff" strokeWidth="1" />
        <circle cx="580" cy={y + 100} r="5" fill="#1B0A3E" />
      </g>
    ))}

    {/* Stars on rails */}
    {[400, 850, 1100, 1400].map((y, i) => (
      <Star key={i} x={i % 2 === 0 ? 20 : 580} y={y} size={10} fill="#00F5D4" />
    ))}

    {/* Bottom */}
    <rect x="0" y="1660" width="600" height="184" fill="url(#cyber-grad)" />
    <text x="300" y="1720" textAnchor="middle" fontFamily="monospace" fontSize="18" fill="#00F5D4">
      &gt;&gt; SAVED &lt;&lt;
    </text>
    <IGSignature cx={300} cy={1785} scale={1} textColor="#fff" />
  </svg>
);

const StripSiamMarigold: React.FC = () => (
  <svg viewBox="0 0 600 1844" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
    <rect x="0" y="0" width="600" height="130" fill="#FFF8DC" />
    <rect x="0" y="0" width="600" height="6" fill="#D4A017" />

    <text x="300" y="55" textAnchor="middle" fontFamily="serif" fontWeight="900" fontSize="34" fill="#8B4513">
      เฮง Photobooth
    </text>
    <text x="300" y="95" textAnchor="middle" fontFamily="serif" fontSize="18" fill="#A0826D" fontStyle="italic">
      ✦ ดาวเรืองสยาม ✦
    </text>

    {/* Marigold corners */}
    <Marigold x={60} y={60} size={20} />
    <Marigold x={540} y={60} size={20} />

    {/* Cream rails */}
    <rect x="0" y="130" width="40" height="1530" fill="#FFF8DC" />
    <rect x="560" y="130" width="40" height="1530" fill="#FFF8DC" />

    {/* Gutters */}
    <rect x="0" y="690" width="600" height="30" fill="#FFF8DC" />
    <rect x="0" y="1270" width="600" height="30" fill="#FFF8DC" />

    {/* Slot borders — gold double */}
    {[
      [40, 140, 560, 690],
      [40, 720, 560, 1270],
      [40, 1300, 560, 1640],
    ].map(([x1, y1, x2, y2], i) => (
      <g key={i}>
        <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="none" stroke="#D4A017" strokeWidth="2" />
        <rect x={x1 + 6} y={y1 + 6} width={x2 - x1 - 12} height={y2 - y1 - 12} fill="none" stroke="#D4A017" strokeWidth="0.8" />
      </g>
    ))}

    {/* Marigolds on rails */}
    {[300, 1000, 1500].map((y, i) => (
      <g key={i}>
        <Marigold x={20} y={y} size={16} />
        <Marigold x={580} y={y + 200} size={16} />
      </g>
    ))}

    {/* Thai pattern dots on gutters */}
    {[100, 200, 300, 400, 500].map((x, i) => (
      <g key={i}>
        <circle cx={x} cy="705" r="2.5" fill="#D4A017" />
        <circle cx={x} cy="1285" r="2.5" fill="#D4A017" />
      </g>
    ))}

    {/* Bottom */}
    <rect x="0" y="1660" width="600" height="184" fill="#FFF8DC" />
    <rect x="0" y="1838" width="600" height="6" fill="#D4A017" />
    <text x="300" y="1720" textAnchor="middle" fontFamily="serif" fontSize="20" fill="#8B4513" fontStyle="italic">
      ✦ ความทรงจำดี ✦
    </text>
    <IGSignature cx={300} cy={1785} scale={1} textColor="#8B4513" />
  </svg>
);

const StripBunnyCute: React.FC = () => (
  <svg viewBox="0 0 600 1844" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
    <rect x="0" y="0" width="600" height="130" fill="#FFEEF5" />

    {/* Bunny corners */}
    <Bunny x={70} y={70} size={28} />
    <Bunny x={530} y={70} size={28} />

    <text x="300" y="50" textAnchor="middle" fontFamily="cursive" fontWeight="900" fontSize="30" fill="#FF80AB">
      ♡ heng photo ♡
    </text>
    <text x="300" y="95" textAnchor="middle" fontFamily="cursive" fontSize="16" fill="#FF6B9D" fontStyle="italic">
      bunny bunny cute!
    </text>

    {/* Pink rails */}
    <rect x="0" y="130" width="40" height="1530" fill="#FFEEF5" />
    <rect x="560" y="130" width="40" height="1530" fill="#FFEEF5" />

    {/* Gutters */}
    <rect x="0" y="690" width="600" height="30" fill="#FFEEF5" />
    <rect x="0" y="1270" width="600" height="30" fill="#FFEEF5" />

    {/* Slot borders — pink wavy */}
    {[
      [40, 140, 560, 690],
      [40, 720, 560, 1270],
      [40, 1300, 560, 1640],
    ].map(([x1, y1, x2, y2], i) => (
      <rect key={i} x={x1 + 4} y={y1 + 4} width={x2 - x1 - 8} height={y2 - y1 - 8} rx="20" fill="none" stroke="#FF80AB" strokeWidth="3" />
    ))}

    {/* Hearts on rails */}
    {[300, 600, 1000, 1300, 1500].map((y, i) => (
      <g key={i}>
        <Heart x={20} y={y} size={11} fill="#FF80AB" />
        <Heart x={580} y={y + 100} size={11} fill="#FF80AB" />
      </g>
    ))}

    {/* Cute decorations on gutters */}
    <text x="300" y="710" textAnchor="middle" fontSize="20">🎀</text>
    <text x="300" y="1290" textAnchor="middle" fontSize="20">🌷</text>

    {/* Bottom */}
    <rect x="0" y="1660" width="600" height="184" fill="#FFEEF5" />
    <text x="300" y="1720" textAnchor="middle" fontFamily="cursive" fontSize="20" fill="#FF6B9D" fontStyle="italic">
      ♡ stay cute always ♡
    </text>
    <IGSignature cx={300} cy={1785} scale={1} textColor="#FF80AB" />
  </svg>
);

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
