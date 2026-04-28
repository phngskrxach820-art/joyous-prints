import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadConfig, saveConfig, type AdminConfig } from "@/lib/admin-config";
import { toast } from "sonner";
import { Lock, CheckCircle2, Printer, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Session = {
  id: string;
  first_name: string | null;
  phone: string | null;
  format: string | null;
  payment_status: string;
  price: number;
  photo_url: string | null;
  created_at: string;
};

type PrintJob = { id: string; session_id: string; status: string; created_at: string };

function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [cfg, setCfg] = useState<AdminConfig>(loadConfig());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [queue, setQueue] = useState<PrintJob[]>([]);

  useEffect(() => {
    if (!unlocked) return;
    const load = async () => {
      const [{ data: s }, { data: q }] = await Promise.all([
        supabase
          .from("sessions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("print_queue")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      setSessions((s as Session[]) || []);
      setQueue((q as PrintJob[]) || []);
    };
    load();
    const ch = supabase
      .channel("admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "print_queue" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [unlocked]);

  const tryUnlock = () => {
    if (pin === cfg.pin) {
      setUnlocked(true);
    } else {
      toast.error("PIN ไม่ถูกต้อง");
    }
  };

  const save = () => {
    saveConfig(cfg);
    toast.success("บันทึกแล้ว");
  };

  const confirmPaid = async (id: string) => {
    await supabase.from("sessions").update({ payment_status: "paid" }).eq("id", id);
    toast.success("ยืนยันการชำระเงิน");
  };

  const updateJob = async (id: string, status: string) => {
    await supabase.from("print_queue").update({ status }).eq("id", id);
  };

  if (!unlocked) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm p-8 rounded-2xl border border-white/10 bg-card/60 text-center">
          <Lock className="h-10 w-10 text-gold mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mb-6">กรอก PIN เพื่อเข้าใช้งาน</p>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
            placeholder="PIN"
            className="input text-center text-xl tracking-[0.5em] mb-4"
          />
          <button
            onClick={tryUnlock}
            className="w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-semibold"
          >
            เข้าสู่ระบบ
          </button>
          <p className="mt-4 text-xs text-muted-foreground">Default: 1234</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card title="ตั้งค่า">
          <Setting label="PIN">
            <input className="input" value={cfg.pin} onChange={(e) => setCfg({ ...cfg, pin: e.target.value })} />
          </Setting>
          <Setting label="PromptPay (เบอร์/เลขบัตร)">
            <input className="input" value={cfg.promptpayId} onChange={(e) => setCfg({ ...cfg, promptpayId: e.target.value })} />
          </Setting>
          <Setting label="ราคา (บาท)">
            <input type="number" className="input" value={cfg.price} onChange={(e) => setCfg({ ...cfg, price: Number(e.target.value) })} />
          </Setting>
          <Setting label="Watermark">
            <input className="input" value={cfg.watermark} onChange={(e) => setCfg({ ...cfg, watermark: e.target.value })} />
          </Setting>
          <Setting label="Hot folder">
            <input className="input" value={cfg.hotFolder} onChange={(e) => setCfg({ ...cfg, hotFolder: e.target.value })} />
          </Setting>
          <Setting label="Filter">
            <select className="input" value={cfg.filter} onChange={(e) => setCfg({ ...cfg, filter: e.target.value as AdminConfig["filter"] })}>
              <option value="none">None</option>
              <option value="warm">Warm</option>
              <option value="cool">Cool</option>
              <option value="bw">B&W</option>
            </select>
          </Setting>
          <button onClick={save} className="mt-4 w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-semibold">
            บันทึก
          </button>
        </Card>

        <Card title="คิวพิมพ์">
          {queue.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีคิว</p>}
          <div className="space-y-2">
            {queue.map((j) => (
              <div key={j.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <Printer className="h-4 w-4 text-gold shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-mono truncate">{j.session_id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{j.status}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {j.status !== "done" && (
                    <button onClick={() => updateJob(j.id, "done")} className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-300 hover:bg-green-500/30">
                      ✓ Done
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Sessions ล่าสุด">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground text-xs uppercase">
              <tr className="border-b border-white/10">
                <th className="py-3 pr-4">เวลา</th>
                <th className="pr-4">ชื่อ</th>
                <th className="pr-4">Format</th>
                <th className="pr-4">ราคา</th>
                <th className="pr-4">สถานะ</th>
                <th className="pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-4 text-muted-foreground text-xs">
                    {new Date(s.created_at).toLocaleString("th-TH")}
                  </td>
                  <td className="pr-4">{s.first_name || "—"}</td>
                  <td className="pr-4 text-muted-foreground">{s.format || "—"}</td>
                  <td className="pr-4">{s.price} ฿</td>
                  <td className="pr-4">
                    <StatusBadge status={s.payment_status} />
                  </td>
                  <td className="pr-4">
                    {s.payment_status === "pending" && s.first_name && (
                      <button
                        onClick={() => confirmPaid(s.id)}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-gold text-primary-foreground font-semibold"
                      >
                        <CheckCircle2 className="h-3 w-3" /> ยืนยัน
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    ยังไม่มี session
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="p-6 rounded-2xl border border-white/10 bg-card/60">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Setting({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-green-500/20 text-green-300",
    pending: "bg-yellow-500/20 text-yellow-300",
    timeout: "bg-red-500/20 text-red-300",
    failed: "bg-red-500/20 text-red-300",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${styles[status] || "bg-white/10"}`}>
      {status}
    </span>
  );
}
