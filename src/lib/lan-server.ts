// Local LAN server config (browser-only).
// Stores manual IP override and detects LAN IP via WebRTC.

const KEY = "photobooth_lan_config_v1";
const DEFAULT_PORT = 3000;

export type LanConfig = {
  manualIp: string; // empty = auto-detect
  port: number;
};

const defaults: LanConfig = { manualIp: "", port: DEFAULT_PORT };

export function loadLan(): LanConfig {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function saveLan(cfg: LanConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

// Detect LAN IP via WebRTC ICE candidates.
let cachedIp: string | null = null;
export async function detectLocalIp(timeoutMs = 1500): Promise<string | null> {
  if (cachedIp) return cachedIp;
  if (typeof window === "undefined" || typeof RTCPeerConnection === "undefined") return null;

  return new Promise((resolve) => {
    let done = false;
    const finish = (ip: string | null) => {
      if (done) return;
      done = true;
      try { pc.close(); } catch {}
      if (ip) cachedIp = ip;
      resolve(ip);
    };

    const pc = new RTCPeerConnection({ iceServers: [] });
    try {
      pc.createDataChannel("");
    } catch {
      finish(null);
      return;
    }
    pc.createOffer().then((o) => pc.setLocalDescription(o)).catch(() => finish(null));

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const m = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (!m) return;
      const ip = m[1];
      // Skip 0.x and obvious mDNS / loopback
      if (ip.startsWith("0.") || ip.startsWith("127.")) return;
      finish(ip);
    };

    setTimeout(() => finish(null), timeoutMs);
  });
}

export async function getLanBaseUrl(): Promise<string> {
  const cfg = loadLan();
  const ip = cfg.manualIp || (await detectLocalIp()) || "localhost";
  return `http://${ip}:${cfg.port}`;
}

export async function uploadToLan(
  sessionId: string,
  kind: "photo" | "gif",
  blob: Blob,
): Promise<string> {
  const base = await getLanBaseUrl();
  const fd = new FormData();
  fd.append("file", blob, kind === "gif" ? "animated.gif" : "photo.jpg");
  const res = await fetch(`${base}/upload/${sessionId}/${kind}`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error(`LAN upload failed (${res.status})`);
  return `${base}/d/${sessionId}/${kind}`;
}

export async function pingLanServer(): Promise<boolean> {
  try {
    const base = await getLanBaseUrl();
    const res = await fetch(`${base}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
