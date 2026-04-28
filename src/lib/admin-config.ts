// Local admin settings (browser-only). These are kiosk-level config, not secrets.
const KEY = "photobooth_admin_config_v1";

export type AdminConfig = {
  pin: string;
  promptpayId: string;
  price: number;
  watermark: string;
  filter: "none" | "warm" | "cool" | "bw";
  hotFolder: string;
};

const defaults: AdminConfig = {
  pin: "1234",
  promptpayId: "0812345678",
  price: 50,
  watermark: "@ig:hexjng",
  filter: "none",
  hotFolder: "/photos/incoming",
};

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
}
