// Photo filters used across capture, picker, and composer.
export const FILTERS = {
  none: "none",
  // Soft skin — natural smoothing, professional look
  softSkin: "brightness(1.03) contrast(0.96) saturate(1.05)",
  // Vintage — warm film tone, like Kodak Portra
  vintage: "sepia(0.18) brightness(1.02) contrast(0.94) saturate(1.08) hue-rotate(-4deg)",
  // Black & White — premium monochrome
  blackWhite: "grayscale(1) contrast(1.12) brightness(1.04)",
} as const;

export type FilterKey = keyof typeof FILTERS;

export const FILTER_LABELS: Record<FilterKey, string> = {
  none: "ปกติ",
  softSkin: "ผิวเนียน ✨",
  vintage: "วินเทจ 🎞️",
  blackWhite: "ขาวดำ 🖤",
};
