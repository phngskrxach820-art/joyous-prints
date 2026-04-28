import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Loader2, Download, Printer, Sparkles, Star } from "lucide-react";
import { CaptureFlow } from "@/components/CaptureFlow";
import { LAYOUTS, renderLayout, type LayoutId } from "@/lib/composer";
import { loadConfig } from "@/lib/admin-config";
import QRCode from "qrcode";

export const Route = createFileRoute("/session/$id")({
  component: SessionPage,
});

type Step = "capture" | "uploading" | "format" | "payment" | "rendering" | "delivery";

function SessionPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("capture");
  const [photoBlobs, setPhotoBlobs] = useState<Blob[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [layout, setLayout] = useState<LayoutId>("B");
  const [confirming, setConfirming] = useState(false);
  const [paid, setPaid] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string>("");
  const [downloadQr, setDownloadQr] = useState<string>("");
  const [printOpen, setPrintOpen] = useState(false);

  const cfg = typeof window !== "undefined" ? loadConfig() : null;
  const price = cfg?.price ?? 50;

  // After capture: upload to storage
  async function handleCaptured(blobs: Blob[]) {
    setPhotoBlobs(blobs);
    setStep("uploading");
    try {
      const urls: string[] = [];
      for (let i = 0; i < blobs.length; i++) {
        const path = `${id}/shot-${i + 1}-${Date.now()}.jpg`;
        const { error } = await supabase.storage.from("photos").upload(path, blobs[i], {
          contentType: "image/jpeg",
          upsert: true,
        });
        if (error) throw error;
        const { data } = supabase.storage.from("photos").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setPhotoUrls(urls);
      await supabase.from("sessions").update({ photos: urls }).eq("id", id);
      setStep("format");
    } catch (e) {
      console.error(e);
      toast.error("อัปโหลดรูปไม่สำเร็จ");
      setStep("capture");
    }
  }

  async function chooseLayout(l: LayoutId) {
    setLayout(l);
    await supabase.from("sessions").update({ layout: l }).eq("id", id);
    setStep("payment");
  }

  async function confirmPayment() {
    setConfirming(true);
    // Mark in DB; simulate verification 10s
    await supabase.from("sessions").update({ payment_status: "checking" }).eq("id", id);
    setTimeout(async () => {
      await supabase.from("sessions").update({ payment_status: "paid" }).eq("id", id);
      setPaid(true);
      setTimeout(() => {
        setStep("rendering");
        renderAndProceed();
      }, 1500);
    }, 10000);
  }

  async function renderAndProceed() {
    try {
      const blob = await renderLayout(layout, photoUrls);
      const ext = layout === "D" ? "gif" : "jpg";
      const ct = layout === "D" ? "image/gif" : "image/jpeg";
      const path = `${id}/output-${layout}.${ext}`;
      const { error } = await supabase.storage.from("photos").upload(path, blob, {
        contentType: ct,
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      await supabase.from("sessions").update({ output_url: data.publicUrl }).eq("id", id);
      setOutputUrl(data.publicUrl);

      const downloadUrl = `${window.location.origin}/download/${id}`;
      const qr = await QRCode.toDataURL(downloadUrl, { margin: 1, width: 320 });
      setDownloadQr(qr);
      setStep("delivery");
    } catch (e) {
      console.error(e);
      toast.error("สร้างรูปไม่สำเร็จ");
    }
  }

  // Print modal
  function openPrint() {
    setPrintOpen(true);
  }
  function doPrint() {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const orient = cfg?.printOrientation === "portrait" ? "portrait" : "landscape";
    w.document.write(`
      <html><head><title>Print</title>
      <style>
        @page { size: 4in 6in ${orient}; margin: 0; }
        body { margin: 0; }
        img { width: 100%; height: 100%; object-fit: contain; display: block; }
      </style>
      </head><body><img src="${outputUrl}" onload="window.print(); setTimeout(() => window.close(), 500)"/></body></html>
    `);
    w.document.close();
    setPrintOpen(false);
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-5xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> หน้าแรก
      </Link>

      {step === "capture" && <CaptureFlow onComplete={handleCaptured} />}

      {step === "uploading" && (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">กำลังอัปโหลดรูปนะ...</p>
        </div>
      )}

      {step === "format" && (
        <section className="animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-2">อยากได้แบบไหน?</h2>
          <p className="text-muted-foreground mb-8">เลือก 1 แบบจาก 4 ฟอร์แมต</p>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLayout(l.id)}
                className={`relative p-6 rounded-3xl border-2 text-left transition-all ${
                  layout === l.id
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {l.recommended && (
                  <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1">
                    <Star className="h-3 w-3" /> แนะนำ
                  </div>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{l.emoji}</span>
                  <h3 className="font-heading font-bold text-xl">{l.label}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{l.desc}</p>
                <FormatPreview id={l.id} photos={photoUrls} />
                {l.digitalOnly && (
                  <p className="mt-3 text-xs text-secondary">* เซฟไฟล์อย่างเดียว ไม่ปริ้นท์</p>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => chooseLayout(layout)}
            className="w-full h-14 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:scale-[1.01] transition"
          >
            ไปต่อเลย →
          </button>
        </section>
      )}

      {step === "payment" && (
        <section className="animate-fade-in max-w-md mx-auto text-center">
          <h2 className="text-3xl font-heading font-bold mb-2">สแกน QR จ่ายได้เลย</h2>
          <p className="text-muted-foreground mb-6">PromptPay รับทุกธนาคาร</p>

          <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl mb-6">
            <img src="/qr-payment.png" alt="PromptPay QR" className="w-[280px] max-w-full" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23f0f0f0'/><text x='100' y='100' text-anchor='middle' fill='%23999' font-size='14'>อัปโหลด /public/qr-payment.png</text></svg>"; }} />
          </div>

          <p className="font-bold text-xl">นาย พงศกร อาจหาญ</p>
          <p className="text-sm text-muted-foreground mb-2">รับเงินได้จากทุกธนาคาร</p>
          <p className="text-3xl font-heading font-bold text-primary mb-8">{price} ฿</p>

          {!confirming ? (
            <button
              onClick={confirmPayment}
              className="w-full h-14 rounded-full bg-green-600 text-white font-semibold text-lg hover:bg-green-700 transition"
            >
              ✓ โอนแล้ว ยืนยันเลย
            </button>
          ) : !paid ? (
            <div className="py-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="font-semibold">กำลังเช็คให้นะ รอแปปนึง...</p>
              <p className="text-sm text-muted-foreground mt-1">รอสักครู่นะ ใช้เวลาประมาณ 10 วินาที</p>
            </div>
          ) : (
            <div className="py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-3 animate-pop" />
              <p className="text-xl font-semibold">เรียบร้อย! รับรูปได้เลย 🎉</p>
            </div>
          )}
        </section>
      )}

      {step === "rendering" && (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Sparkles className="h-12 w-12 animate-pulse-soft text-primary" />
          <p className="text-lg">กำลังจัดรูปสวยๆ ให้นะ...</p>
        </div>
      )}

      {step === "delivery" && (
        <section className="animate-fade-in">
          <h2 className="text-3xl font-heading font-bold mb-6 text-center">เสร็จแล้ว! ขอบคุณนะ 🎉</h2>

          {/* Output preview */}
          <div className="flex justify-center mb-8">
            <div className="bg-card p-3 rounded-2xl shadow-2xl max-w-md">
              <img src={outputUrl} alt="output" className="w-full rounded-xl" />
            </div>
          </div>

          {layout === "D" ? (
            <div className="max-w-md mx-auto p-6 rounded-3xl border border-border bg-card text-center">
              <p className="text-2xl mb-3">✨</p>
              <h3 className="font-heading font-bold text-xl mb-3">เซฟ GIF ลงมือถือ</h3>
              <p className="text-sm text-muted-foreground mb-4">สแกนเลย</p>
              {downloadQr && <img src={downloadQr} alt="qr" className="w-44 mx-auto rounded-xl" />}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
              <div className="p-6 rounded-3xl border border-border bg-card text-center">
                <p className="text-2xl mb-2">📲</p>
                <h3 className="font-heading font-bold text-lg mb-3">เซฟลงมือถือ</h3>
                <p className="text-xs text-muted-foreground mb-3">สแกน QR ด้วยมือถือ</p>
                {downloadQr && <img src={downloadQr} alt="qr" className="w-40 mx-auto rounded-xl" />}
              </div>
              <div className="p-6 rounded-3xl border border-border bg-card text-center flex flex-col">
                <p className="text-2xl mb-2">🖨️</p>
                <h3 className="font-heading font-bold text-lg mb-3">ปริ้นท์รับเลย</h3>
                <p className="text-xs text-muted-foreground mb-4 flex-1">ดูตัวอย่างก่อนแล้วค่อยปริ้นท์</p>
                <button
                  onClick={openPrint}
                  className="h-12 rounded-full bg-primary text-primary-foreground font-semibold hover:scale-[1.02] transition inline-flex items-center justify-center gap-2"
                >
                  <Printer className="h-4 w-4" /> ปริ้นท์รับเลย 🖨️
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate({ to: "/" })}
            className="block mx-auto mt-10 text-sm text-muted-foreground hover:text-foreground"
          >
            จบ session
          </button>

          {/* Print preview modal */}
          {printOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-card max-w-2xl w-full rounded-3xl p-6 shadow-2xl">
                <h3 className="font-heading font-bold text-xl mb-4">ตัวอย่างก่อนปริ้นท์</h3>
                <img src={outputUrl} alt="preview" className="w-full rounded-xl mb-4 border border-border" />
                <p className="text-xs text-muted-foreground mb-4">
                  4×6 นิ้ว · 300 DPI · {cfg?.printOrientation === "portrait" ? "แนวตั้ง" : "แนวนอน"}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPrintOpen(false)}
                    className="flex-1 h-12 rounded-full border border-border font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={doPrint}
                    className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <Printer className="h-4 w-4" /> ปริ้นท์
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function FormatPreview({ id, photos }: { id: LayoutId; photos: string[] }) {
  const p = (i: number) => photos[i] ?? "";
  if (id === "A") {
    return (
      <div className="aspect-[3/2] bg-black rounded-xl p-1 flex gap-1">
        {[0, 1].map((s) => (
          <div key={s} className="flex-1 grid grid-rows-3 gap-0.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-muted overflow-hidden rounded">
                {p(i) && <img src={p(i)} alt="" className="w-full h-full object-cover" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (id === "B") {
    return (
      <div className="aspect-[3/2] bg-white rounded-xl p-1 grid grid-cols-2 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-muted overflow-hidden rounded">
            {p(i) && <img src={p(i)} alt="" className="w-full h-full object-cover" />}
          </div>
        ))}
      </div>
    );
  }
  if (id === "C") {
    return (
      <div className="aspect-[2/3] mx-auto w-1/2 bg-white rounded-xl p-1 flex flex-col gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 bg-muted overflow-hidden rounded">
            {p(i) && <img src={p(i)} alt="" className="w-full h-full object-cover" />}
          </div>
        ))}
      </div>
    );
  }
  // D — animated cycle
  return (
    <div className="aspect-square bg-black rounded-xl overflow-hidden relative">
      {photos.slice(0, 4).map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            animation: `gifCycle 0.6s steps(1) ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes gifCycle { 0%, 25% { opacity: 1; } 26%, 100% { opacity: 0; } }`}</style>
    </div>
  );
}
