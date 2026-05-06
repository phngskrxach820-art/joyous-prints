// Local LAN file delivery server for the photobooth.
// Run on the MacBook: `node server/index.js`
// Serves uploaded photos and GIFs over the LAN so customers can scan a QR
// from their phone (must be on the SAME WiFi).

import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const OUTPUTS_DIR = path.join(__dirname, "..", "outputs");

if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true });

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function fileFor(sessionId, kind) {
  const safeId = String(sessionId).replace(/[^a-zA-Z0-9-_]/g, "");
  if (!safeId) return null;
  const dir = path.join(OUTPUTS_DIR, safeId);
  const name = kind === "gif" ? "animated.gif" : "photo.jpg";
  return { dir, full: path.join(dir, name), name };
}

app.get("/health", (_req, res) => res.json({ ok: true, time: Date.now() }));

app.post("/upload/:sessionId/:kind", upload.single("file"), (req, res) => {
  const { sessionId, kind } = req.params;
  const f = fileFor(sessionId, kind);
  if (!f) return res.status(400).json({ error: "bad sessionId" });
  if (!req.file) return res.status(400).json({ error: "no file" });
  if (!fs.existsSync(f.dir)) fs.mkdirSync(f.dir, { recursive: true });
  fs.writeFileSync(f.full, req.file.buffer);
  res.json({ ok: true, url: `/d/${sessionId}/${kind === "gif" ? "gif" : "photo"}` });
});

app.get("/d/:sessionId/:kind", (req, res) => {
  const { sessionId, kind } = req.params;
  const f = fileFor(sessionId, kind);
  if (!f || !fs.existsSync(f.full)) return res.status(404).send("Not found");
  res.setHeader("Content-Type", kind === "gif" ? "image/gif" : "image/jpeg");
  res.setHeader("Content-Disposition", `attachment; filename="heng-photobooth-${sessionId.slice(0, 8)}.${kind === "gif" ? "gif" : "jpg"}"`);
  fs.createReadStream(f.full).pipe(res);
});

// Cleanup older than 24h, runs every hour
function cleanup() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  if (!fs.existsSync(OUTPUTS_DIR)) return;
  for (const entry of fs.readdirSync(OUTPUTS_DIR)) {
    const p = path.join(OUTPUTS_DIR, entry);
    try {
      const st = fs.statSync(p);
      if (st.isDirectory() && st.mtimeMs < cutoff) {
        fs.rmSync(p, { recursive: true, force: true });
        console.log("[cleanup] removed", entry);
      }
    } catch {}
  }
}
setInterval(cleanup, 60 * 60 * 1000);
cleanup();

function lanIPs() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const iface of list || []) {
      if (iface.family === "IPv4" && !iface.internal) out.push(iface.address);
    }
  }
  return out;
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n📸 Photobooth LAN server running on port ${PORT}`);
  console.log(`Local URLs: ${lanIPs().map((ip) => `http://${ip}:${PORT}`).join(", ") || "no LAN interface found"}`);
  console.log(`Outputs folder: ${OUTPUTS_DIR}\n`);
});
