import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generatePromptPayQR, generateUrlQR } from "@/lib/promptpay";
import { loadConfig } from "@/lib/admin-config";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Grid2x2,
  Rows3,
  Film,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Printer,
  ArrowLeft,
} from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/session/$id")({
  component: SessionPage,
});

type Step = "format" | "form" | "payment" | "delivery";

const formats = [
  { id: "single", label: "Single Print", icon: ImageIcon },
  { id: "collage", label: "2×2 Collage", icon: Grid2x2 },
  { id: "strip", label: "3-Strip", icon: Rows3 },
  { id: "gif", label: "GIF Animated", icon: Film },
];

const formSchema = z.object({
  first_name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(60),
  phone: z.string().trim().regex(/^\d{9,10}$/, "เบอร์ไม่ถูกต้อง"),
  email: z.string().trim().email("อีเมลไม่ถูกต้อง").max(255).optional().or(z.literal("")),
  consent: z.boolean(),
});

function SessionPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const cfg = typeof window !== "undefined" ? loadConfig() : null;
  const [step, setStep] = useState<Step>("format");
  const [format, setFormat] = useState<string>("single");
  const [form, setForm] = useState({ first_name: "", phone: "", email: "", consent: false });
  const [qr, setQr] = useState<string>("");
  const [downloadQr, setDownloadQr] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "timeout" | "failed">(
    "pending"
  );
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [printing, setPrinting] = useState(false);

  // Subscribe to payment status changes (admin confirms in /admin)
  useEffect(() => {
    if (step !== "payment") return;
    const channel = supabase
      .channel(`session-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${id}` },
        (payload) => {
          const status = (payload.new as { payment_status: string }).payment_status;
          if (status === "paid") {
            setPaymentStatus("paid");
            toast.success("ชำระเงินสำเร็จ!");
            setTimeout(() => setStep("delivery"), 1200);
          } else if (status === "failed") {
            setPaymentStatus("failed");
          }
        }
      )
      .subscribe();
    // Polling fallback every 3s
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("sessions")
        .select("payment_status")
        .eq("id", id)
        .maybeSingle();
      if (data?.payment_status === "paid") {
        setPaymentStatus("paid");
        setTimeout(() => setStep("delivery"), 1200);
      }
    }, 3000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [step, id]);

  // Countdown for payment timeout
  useEffect(() => {
    if (step !== "payment" || paymentStatus !== "pending") return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setPaymentStatus("timeout");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step, paymentStatus]);

  // Generate download QR when entering delivery
  useEffect(() => {
    if (step !== "delivery") return;
    const url = `${window.location.origin}/download/${id}`;
    generateUrlQR(url).then(setDownloadQr);
  }, [step, id]);

  async function chooseFormat() {
    await supabase.from("sessions").update({ format }).eq("id", id);
    setStep("form");
  }

  async function submitForm() {
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    await supabase
      .from("sessions")
      .update({
        first_name: parsed.data.first_name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        consent: parsed.data.consent,
      })
      .eq("id", id);

    // Generate PromptPay QR
    const config = loadConfig();
    const qrData = await generatePromptPayQR(config.promptpayId, config.price);
    setQr(qrData);
    setSecondsLeft(300);
    setPaymentStatus("pending");
    setStep("payment");
  }

  async function retryPayment() {
    const config = loadConfig();
    const qrData = await generatePromptPayQR(config.promptpayId, config.price);
    setQr(qrData);
    setSecondsLeft(300);
    setPaymentStatus("pending");
  }

  async function addToPrintQueue() {
    setPrinting(true);
    await supabase.from("print_queue").insert({ session_id: id });
    toast.success("ส่งเข้าคิวพิมพ์แล้ว!");
    setTimeout(() => setPrinting(false), 1500);
  }

  const price = cfg?.price ?? 50;

  return (
    <main className="min-h-screen px-4 py-8 md:py-12 max-w-2xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> หน้าแรก
      </Link>

      <Stepper step={step} />

      {step === "format" && (
        <section className="animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">เลือกรูปแบบ</h2>
          <p className="text-muted-foreground mb-8">เลือกฟอร์แมตที่คุณต้องการ</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {formats.map((f) => {
              const Icon = f.icon;
              const active = format === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`p-6 rounded-2xl border-2 transition-all text-left ${
                    active
                      ? "border-primary bg-primary/10 shadow-gold"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <Icon className={`h-8 w-8 mb-3 ${active ? "text-gold" : "text-foreground"}`} />
                  <p className="font-semibold">{f.label}</p>
                </button>
              );
            })}
          </div>
          <PrimaryButton onClick={chooseFormat}>ถัดไป</PrimaryButton>
        </section>
      )}

      {step === "form" && (
        <section className="animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">ข้อมูลของคุณ</h2>
          <p className="text-muted-foreground mb-8">เพื่อส่งรูปและการแจ้งเตือน</p>
          <div className="space-y-4 mb-8">
            <Field label="ชื่อ *">
              <input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                maxLength={60}
                className="input"
                placeholder="ชื่อจริง"
              />
            </Field>
            <Field label="เบอร์โทร *">
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                }
                inputMode="numeric"
                className="input"
                placeholder="0812345678"
              />
            </Field>
            <Field label="อีเมล (ไม่บังคับ)">
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
                type="email"
                className="input"
                placeholder="you@example.com"
              />
            </Field>
            <label className="flex items-start gap-3 p-4 rounded-xl border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                className="mt-1 h-5 w-5 accent-[oklch(0.76_0.13_80)]"
              />
              <span className="text-sm text-muted-foreground">
                ยินยอมรับข่าวสารและโปรโมชั่นจากเรา
              </span>
            </label>
          </div>
          <PrimaryButton onClick={submitForm}>ดำเนินการต่อ</PrimaryButton>
        </section>
      )}

      {step === "payment" && (
        <section className="animate-fade-in text-center">
          <h2 className="text-3xl font-bold mb-2">สแกนเพื่อชำระเงิน</h2>
          <p className="text-muted-foreground mb-6">
            ยอด <span className="text-gold font-semibold">{price} บาท</span>
          </p>

          {paymentStatus === "pending" && (
            <>
              <div className="inline-block bg-white p-6 rounded-3xl shadow-gold animate-pulse-soft mb-6">
                {qr ? (
                  <img src={qr} alt="PromptPay QR" className="w-64 h-64" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-black" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>รอการยืนยัน... ({formatTime(secondsLeft)})</span>
              </div>
              <p className="text-xs text-muted-foreground">
                แอดมินจะยืนยันการชำระเงินใน /admin
              </p>
            </>
          )}

          {paymentStatus === "paid" && (
            <div className="py-12">
              <CheckCircle2 className="h-20 w-20 text-green-400 mx-auto mb-4 animate-fade-in" />
              <p className="text-xl font-semibold">ชำระเงินสำเร็จ</p>
            </div>
          )}

          {(paymentStatus === "timeout" || paymentStatus === "failed") && (
            <div className="py-8">
              <XCircle className="h-20 w-20 text-destructive mx-auto mb-4" />
              <p className="text-xl font-semibold mb-2">
                {paymentStatus === "timeout" ? "หมดเวลาชำระเงิน" : "การชำระเงินล้มเหลว"}
              </p>
              <p className="text-muted-foreground mb-6">กรุณาลองใหม่อีกครั้ง</p>
              <PrimaryButton onClick={retryPayment}>ลองอีกครั้ง</PrimaryButton>
            </div>
          )}
        </section>
      )}

      {step === "delivery" && (
        <section className="animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">รับรูปของคุณ</h2>
          <p className="text-muted-foreground mb-8">เลือกวิธีรับรูป</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-card/60 text-center">
              <Download className="h-6 w-6 text-gold mx-auto mb-3" />
              <h3 className="font-semibold mb-3">ดาวน์โหลด</h3>
              <p className="text-xs text-muted-foreground mb-4">สแกนด้วยมือถือ</p>
              <div className="bg-white p-3 rounded-xl inline-block">
                {downloadQr ? (
                  <img src={downloadQr} alt="Download" className="w-40 h-40" />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-black" />
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-card/60 text-center flex flex-col">
              <Printer className="h-6 w-6 text-gold mx-auto mb-3" />
              <h3 className="font-semibold mb-3">พิมพ์</h3>
              <p className="text-xs text-muted-foreground mb-4">รับรูปจากเครื่องพิมพ์</p>
              <div className="flex-1 flex items-end">
                <PrimaryButton onClick={addToPrintQueue} disabled={printing}>
                  {printing ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Printing...
                    </span>
                  ) : (
                    "สั่งพิมพ์"
                  )}
                </PrimaryButton>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-8 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            จบ session
          </button>
        </section>
      )}
    </main>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: Step[] = ["format", "form", "payment", "delivery"];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-2 mb-10">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`h-1 flex-1 rounded-full transition-all ${
            i <= idx ? "bg-gradient-gold" : "bg-white/10"
          }`}
        />
      ))}
    </div>
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

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full h-14 rounded-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold hover:scale-[1.01] transition disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
