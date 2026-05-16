import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, RefreshCw, Download, X } from "lucide-react";
import { loadConfig, saveConfig, defaults, THEMES, applyTheme, type AdminConfig } from "@/lib/admin-config";
import { toast } from "sonner";
import { loadLan, saveLan, detectLocalIp, pingLanServer, getLanBaseUrl, type LanConfig } from "@/lib/lan-server";
import { subscribePrintQueue, getPrintQueueState, clearPrintQueue } from "@/lib/print-queue";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

type Session = {
  id: string;
  created_at: string;
  payment_status: string;
  layout: string | null;
  output_url: string | null;
  price: number;
};

type GallerySession = {
  id: string;
  created_at: string;
  layout: string | null;
  payment_status: string;
  photos: string[] | null;
  output_url: string | null;
};

type ReviewSession = {
  id: string;
  created_at: string;
  review_type: string | null;
  review_handle: string | null;
};

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [cfg, setCfg] = useState<AdminConfig>(defaults);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState<ReviewSession[]>([]);
  const [lan, setLan] = useState<LanConfig>({ manualIp: "", port: 3000 });
  const [detectedIp, setDetectedIp] = useState<string>("");
  const [serverUp, setServerUp] = useState<boolean | null>(null);
  const tapTimesRef = useRef<number[]>([]);
  const [pq, setPq] = useState(() => getPrintQueueState());
  const [gallery, setGallery] = useState<GallerySession[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState<"all" | "paid" | "pending">("all");
  const [lightbox, setLightbox] = useState<{ url: string; sessionId: string; index: number } | null>(null);

  useEffect(() => {
    const unsub = subscribePrintQueue(() => setPq(getPrintQueueState()));
    const t = setInterval(() => setPq(getPrintQueueState()), 2000);
    return () => { unsub(); clearInterval(t); };
  }, []);

  useEffect(() => {
    setCfg(loadConfig());
    setLan(loadLan());
  }, []);

  useEffect(() => {
    if (!authed) return;
    detectLocalIp().then((ip) => setDetectedIp(ip || ""));
    pingLanServer().then(setServerUp);
  }, [authed]);

  async function refreshLan() {
    setServerUp(null);
    setDetectedIp("");
    const ip = await detectLocalIp();
    setDetectedIp(ip || "");
    const ok = await pingLanServer();
    setServerUp(ok);
  }

  function updateLan<K extends keyof LanConfig>(key: K, val: LanConfig[K]) {
    const n = { ...lan, [key]: val };
    setLan(n);
    saveLan(n);
  }

  async function testLanUrl() {
    const base = await getLanBaseUrl();
    window.open(`${base}/health`, "_blank");
  }

  async function fetchSessions() {
    const { data } = await supabase
      .from("sessions")
      .select("id,created_at,payment_status,layout,output_url,price")
      .order("created_at", { ascending: false })
      .limit(50);
    setSessions((data as Session[] | null) ?? []);
  }

  useEffect(() => {
    if (authed) fetchSessions();
  }, [authed]);

  function tryLogin() {
    if (pin === cfg.pin) setAuthed(true);
    else toast.error("PIN ไม่ถูกต้อง");
  }

  async function markPaid(id: string) {
    await supabase.from("sessions").update({ payment_status: "paid" }).eq("id", id);
    fetchSessions();
  }

  function update<K extends keyof AdminConfig>(key: K, val: AdminConfig[K]) {
    const n = { ...cfg, [key]: val };
    setCfg(n);
    saveConfig(n);
    if (key === "theme") applyTheme(val as AdminConfig["theme"]);
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm p-8 rounded-3xl bg-card border border-border">
          <Lock className="h-8 w-8 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold text-center mb-6">Admin</h1>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryLogin()}
            placeholder="ใส่ PIN"
            className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-center text-lg tracking-widest mb-4"
          />
          <button onClick={tryLogin} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold">
            เข้าสู่ระบบ
          </button>
          <Link to="/" className="block mt-4 text-center text-sm text-muted-foreground hover:text-foreground">
            ← กลับ
          </Link>
        </div>
      </main>
    );
  }

  function handleHeaderTap() {
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current.filter((t) => now - t < 1500), now];
    if (tapTimesRef.current.length >= 3) {
      tapTimesRef.current = [];
      setShowReviews((v) => !v);
      if (!showReviews) loadReviews();
    }
  }

  async function loadReviews() {
    const { data } = await supabase
      .from("sessions")
      .select("id,created_at,review_type,review_handle")
      .not("review_type", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);
    setReviews((data as ReviewSession[] | null) ?? []);
  }

  const todayCount = reviews.filter((r) => {
    const d = new Date(r.created_at);
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }).length;

  return (
    <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 onClick={handleHeaderTap} className="text-3xl font-heading font-bold cursor-pointer select-none">Admin</h1>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← หน้าแรก</Link>
      </div>

      {showReviews && (
        <section className="mb-8 p-6 rounded-3xl bg-card border border-primary/40">
          <h2 className="font-heading font-bold text-xl mb-4">📊 ข้อมูลรีวิว</h2>
          <div className="flex gap-4 mb-4 text-sm">
            <span className="px-3 py-1.5 rounded-full bg-primary/15 text-primary font-semibold">วันนี้: {todayCount}</span>
            <span className="px-3 py-1.5 rounded-full bg-muted">ทั้งหมด: {reviews.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">วันที่</th>
                  <th className="py-2 pr-3">เวลา</th>
                  <th className="py-2 pr-3">Handle</th>
                  <th className="py-2 pr-3">ประเภท</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 && (
                  <tr><td colSpan={4} className="py-3 text-muted-foreground">ยังไม่มีข้อมูล</td></tr>
                )}
                {reviews.map((r) => {
                  const d = new Date(r.created_at);
                  return (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 pr-3">{d.toLocaleDateString("th-TH")}</td>
                      <td className="py-2 pr-3">{d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{r.review_handle ?? "-"}</td>
                      <td className="py-2 pr-3">{r.review_type}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Theme picker */}
      <section className="mb-8 p-6 rounded-3xl bg-card border border-border">
        <h2 className="font-heading font-bold text-xl mb-4">🎨 ธีม</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => update("theme", t.id)}
              className={`p-4 rounded-2xl border-2 text-left transition ${
                cfg.theme === t.id ? "border-primary scale-[1.02]" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="aspect-video rounded-xl mb-3 relative overflow-hidden" style={{ background: t.preview.bg }}>
                <div className="absolute inset-3 flex flex-col gap-2">
                  <div className="h-3 w-16 rounded-full" style={{ background: t.preview.accent }} />
                  <div className="h-2 w-12 rounded-full" style={{ background: t.preview.secondary }} />
                  <div className="h-2 w-20 rounded-full opacity-50" style={{ background: t.preview.secondary }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span>{t.emoji}</span>
                <span className="font-semibold text-sm">{t.label}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Config */}
      <section className="mb-8 p-6 rounded-3xl bg-card border border-border space-y-4">
        <h2 className="font-heading font-bold text-xl mb-2">⚙️ ตั้งค่า</h2>
        <Field label="PIN">
          <input value={cfg.pin} onChange={(e) => update("pin", e.target.value)} className="input-field" />
        </Field>
        <Field label="ราคา (THB)">
          <input
            type="number"
            value={cfg.price}
            onChange={(e) => update("price", Number(e.target.value))}
            className="input-field"
          />
        </Field>
        <Field label="ลายน้ำ">
          <input value={cfg.watermark} onChange={(e) => update("watermark", e.target.value)} className="input-field" />
        </Field>
        <Field label="แนวกระดาษพิมพ์">
          <select
            value={cfg.printOrientation}
            onChange={(e) => update("printOrientation", e.target.value as AdminConfig["printOrientation"])}
            className="input-field"
          >
            <option value="landscape">แนวนอน (4×6)</option>
            <option value="portrait">แนวตั้ง (4×6)</option>
          </select>
        </Field>
        <Field label="โฟลเดอร์รูป">
          <input value={cfg.hotFolder} onChange={(e) => update("hotFolder", e.target.value)} className="input-field" />
        </Field>
      </section>

      {/* Local LAN server */}
      <section className="mb-8 p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-xl">📡 Local Server (LAN)</h2>
          <button onClick={refreshLan} className="p-2 rounded-full hover:bg-muted" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-3 text-sm">
          ⚠️ ลูกค้าต้องเชื่อม WiFi เดียวกับ MacBook ถึงจะสแกน QR แล้วโหลดรูปได้
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-xl bg-muted/40">
            <div className="text-xs text-muted-foreground mb-1">LAN IP ที่ตรวจเจอ</div>
            <div className="font-mono">{detectedIp || "—"}</div>
          </div>
          <div className="p-3 rounded-xl bg-muted/40">
            <div className="text-xs text-muted-foreground mb-1">สถานะเซิร์ฟเวอร์</div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  serverUp === true ? "bg-green-500" : serverUp === false ? "bg-red-500" : "bg-yellow-500"
                }`}
              />
              <span>{serverUp === true ? "Running" : serverUp === false ? "Stopped / unreachable" : "Checking..."}</span>
            </div>
          </div>
        </div>

        <Field label="Override IP (เว้นว่าง = ใช้ที่ตรวจเจออัตโนมัติ)">
          <input
            value={lan.manualIp}
            onChange={(e) => updateLan("manualIp", e.target.value)}
            placeholder="เช่น 192.168.1.42"
            className="input-field"
          />
        </Field>
        <Field label="Port">
          <input
            type="number"
            value={lan.port}
            onChange={(e) => updateLan("port", Number(e.target.value) || 3000)}
            className="input-field"
          />
        </Field>

        <div className="flex gap-2">
          <button onClick={testLanUrl} className="px-4 h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            ทดสอบเปิด URL
          </button>
          <button onClick={refreshLan} className="px-4 h-10 rounded-full border border-border text-sm font-semibold">
            ตรวจใหม่
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          รัน server บน MacBook: <code className="bg-muted px-1.5 py-0.5 rounded">cd server &amp;&amp; npm install &amp;&amp; npm start</code>
        </p>
      </section>

      {/* Print queue */}
      <section className="mb-8 p-6 rounded-3xl bg-card border border-border space-y-4">
        <h2 className="font-heading font-bold text-xl">🖨️ Print Queue</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm">คิวรอพิมพ์: <span className="font-bold text-primary">{pq.queueLength}</span> งาน</span>
          {pq.isPrinting && (
            <span className="inline-flex items-center gap-2 text-sm text-primary">
              <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              กำลังพิมพ์...
            </span>
          )}
          <button
            onClick={() => { clearPrintQueue(); }}
            className="ml-auto px-4 h-9 rounded-full border border-border text-sm font-semibold hover:bg-muted"
          >
            ล้างคิว
          </button>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-2">10 งานล่าสุด</div>
          <div className="space-y-1">
            {pq.log.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีงานพิมพ์</p>}
            {pq.log.map((l, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 text-xs">
                <span className="font-mono text-muted-foreground">{l.sessionId.slice(0, 8)}</span>
                <span>{l.layout ?? "-"}</span>
                <span>×{l.copies}</span>
                <span className="ml-auto text-muted-foreground">{new Date(l.at).toLocaleTimeString("th-TH")}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="p-6 rounded-3xl bg-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-xl">📋 Sessions</h2>
          <button onClick={fetchSessions} className="p-2 rounded-full hover:bg-muted">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          {sessions.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มี session</p>}
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-border text-sm">
              <span className="font-mono text-xs text-muted-foreground">{s.id.slice(0, 8)}</span>
              <span className="flex-1">
                {s.layout ?? "-"} · {s.price}฿
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  s.payment_status === "paid"
                    ? "bg-green-500/20 text-green-500"
                    : "bg-yellow-500/20 text-yellow-600"
                }`}
              >
                {s.payment_status}
              </span>
              {s.payment_status !== "paid" && (
                <button
                  onClick={() => markPaid(s.id)}
                  className="px-3 py-1 text-xs rounded-full bg-primary text-primary-foreground"
                >
                  ทำเป็นจ่ายแล้ว
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .input-field {
          width: 100%; height: 3rem; padding: 0 1rem; border-radius: 0.875rem;
          background: var(--color-muted); border: 1px solid var(--color-border);
          color: var(--color-foreground); font-size: 1rem;
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-muted-foreground mb-2">{label}</span>
      {children}
    </label>
  );
}
