// Photo filters used across capture, picker, and composer.
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
