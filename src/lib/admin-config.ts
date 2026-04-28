// Local admin settings (browser-only). Kiosk-level config, not secrets.
const KEY = "photobooth_admin_config_v2";

export type ThemeId = "film-grain" | "seoul-soft" | "tokyo-mono" | "y2k-pop";

export type AdminConfig = {
  pin: string;
  price: number;
  watermark: string;
  theme: ThemeId;
  printOrientation: "landscape" | "portrait";
  hotFolder: string;
};

export const defaults: AdminConfig = {
  pin: "1234",
  price: 50,
  watermark: "เฮงที่ชอบพกกล้องมาวิทยาลัย",
  theme: "film-grain",
  printOrientation: "landscape",
  hotFolder: "/photos/incoming",
};

export const THEMES: { id: ThemeId; label: string; emoji: string; preview: { bg: string; accent: string; secondary: string } }[] = [
  { id: "film-grain", label: "Film Grain", emoji: "📽️", preview: { bg: "#F5F0E8", accent: "#C4622D", secondary: "#8B9467" } },
  { id: "seoul-soft", label: "Seoul Soft", emoji: "🇰🇷", preview: { bg: "#FAF7F2", accent: "#E8A598", secondary: "#A8B89A" } },
  { id: "tokyo-mono", label: "Tokyo Mono", emoji: "🇯🇵", preview: { bg: "#FFFFFF", accent: "#111111", secondary: "#888888" } },
  { id: "y2k-pop", label: "Y2K Pop", emoji: "✨", preview: { bg: "#1A0533", accent: "#FF2D9B", secondary: "#00D4FF" } },
];

export function loadConfig(): AdminConfig {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function saveConfig(cfg: AdminConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
  applyTheme(cfg.theme);
}

export function applyTheme(theme: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}
