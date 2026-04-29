import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Loader2, Printer, Sparkles, Star, Check } from "lucide-react";
import { CaptureFlow } from "@/components/CaptureFlow";
import { LAYOUTS, renderLayout, renderLayoutD, type LayoutId } from "@/lib/composer";
import { loadConfig } from "@/lib/admin-config";
import { paymentSuccess } from "@/lib/audio";
import QRCode from "qrcode";

export const Route = createFileRoute("/session/$id")({
  component: SessionPage,
});

type Step = "format" | "capture" | "uploading" | "filter" | "payment" | "rendering" | "delivery";

type FilterId = "none" | "film" | "soft" | "cool" | "bw" | "vintage";
const FILTERS: Record<FilterId, { label: string; css: string }> = {
  none:    { label: "ปกติ",       css: "none" },
  film:    { label: "ฟิล์ม 🎞️",   css: "sepia(30%) contrast(95%) brightness(105%) saturate(85%)" },
  soft:    { label: "นุ่มๆ 🌸",   css: "brightness(110%) saturate(80%) contrast(90%) hue-rotate(5deg)" },
  cool:    { label: "เย็นๆ 🩵",   css: "saturate(70%) brightness(100%) hue-rotate(190deg) contrast(95%)" },
  bw:      { label: "ขาวดำ 🖤",   css: "grayscale(100%) contrast(105%)" },
  vintage: { label: "วินเทจ 🟤",  css: "sepia(50%) brightness(95%) contrast(90%) saturate(75%)" },
};
const FILTER_ORDER: FilterId[] = ["none", "film", "soft", "cool", "bw", "vintage"];

function SessionPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("format");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [layout, setLayout] = useState<LayoutId>("B");
  const [filter, setFilter] = useState<FilterId>("none");
  const [confirming, setConfirming] = useState(false);
  const [paid, setPaid] = useState(false);
  const [photoOutputUrl, setPhotoOutputUrl] = useState<string>("");
  const [gifOutputUrl, setGifOutputUrl] = useState<string>("");
  const [photoQr, setPhotoQr] = useState<string>("");
  const [gifQr, setGifQr] = useState<string>("");
  const [printOpen, setPrintOpen] = useState(false);

  const cfg = typeof window !== "undefined" ? loadConfig() : null;
  const price = cfg?.price ?? 69;

  async function handleCaptured(blobs: Blob[]) {
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
      setStep("filter");
    } catch (e) {
      console.error(e);
      toast.error("อัปโหลดรูปไม่สำเร็จ");
      setStep("capture");
    }
  }

  async function chooseLayout(l: LayoutId) {
    setLayout(l);
    await supabase.from("sessions").update({ layout: l }).eq("id", id);
    setStep("capture");
  }

  function backFromCapture() {
    if (confirm("เริ่มถ่ายใหม่เลยนะ?")) {
      setStep("format");
    }
  }

  function backFromFilter() {
    if (confirm("ถ่ายใหม่เลยนะ?")) {
      setPhotoUrls([]);
      setStep("capture");
    }
  }

  // Background: render+upload BOTH the JPEG collage and the GIF in parallel.
  async function backgroundRender(l: LayoutId, urls: string[], filterCss: string) {
    const photoTask = (async () => {
      const blob = await renderLayout(l, urls, filterCss);
      const path = `${id}/output-photo.jpg`;
      const { error } = await supabase.storage.from("photos").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      return data.publicUrl;
    })();
    const gifTask = (async () => {
      const blob = await renderLayoutD(urls, filterCss);
      const path = `${id}/output-gif.gif`;
      const { error } = await supabase.storage.from("photos").upload(path, blob, {
        contentType: "image/gif",
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      return data.publicUrl;
    })();
    return Promise.all([photoTask, gifTask]);
  }

  async function confirmPayment() {
    setConfirming(true);
    await supabase.from("sessions").update({ payment_status: "checking" }).eq("id", id);

    // Kick off render in background while the 10s "verifying" UX runs.
    const renderPromise = backgroundRender(layout, photoUrls, FILTERS[filter].css).catch((e) => {
      console.error("render failed", e);
      return null;
    });

    setTimeout(async () => {
      await supabase.from("sessions").update({ payment_status: "paid" }).eq("id", id);
      setPaid(true);
      paymentSuccess();
      setStep("rendering");
      const result = await renderPromise;
      if (!result) {
        toast.error("สร้างรูปไม่สำเร็จ");
        return;
      }
      const [photoUrl, gifUrl] = result;
      setPhotoOutputUrl(photoUrl);
      setGifOutputUrl(gifUrl);
      await supabase.from("sessions").update({ output_url: photoUrl }).eq("id", id);

      const origin = window.location.origin;
      const [pq, gq] = await Promise.all([
        QRCode.toDataURL(`${origin}/d/${id}/photo`, { margin: 1, width: 360, errorCorrectionLevel: "H" }),
        QRCode.toDataURL(`${origin}/d/${id}/gif`, { margin: 1, width: 360, errorCorrectionLevel: "H" }),
      ]);
      setPhotoQr(pq);
      setGifQr(gq);
      setStep("delivery");
    }, 10000);
  }

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
      </head><body><img src="${photoOutputUrl}" onload="window.print(); setTimeout(() => window.close(), 500)"/></body></html>
    `);
    w.document.close();
    setPrintOpen(false);
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-5xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> หน้าแรก
      </Link>

      {step === "capture" && (
        <CaptureFlow
          totalShots={LAYOUTS.find((l) => l.id === layout)?.needsCount ?? 4}
          onComplete={handleCaptured}
        />
      )}

      {step === "uploading" && (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">กำลังอัปโหลดรูปนะ...</p>
        </div>
      )}

      {step === "format" && (
        <section className="animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-2">อยากได้แบบไหน?</h2>
          <p className="text-muted-foreground mb-2">เลือกฟอร์แมตสำหรับปริ้นท์</p>
          <p className="text-sm text-muted-foreground mb-8">✨ ทุกแบบจะได้ GIF เคลื่อนไหวแถมไปด้วยฟรี!</p>

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
                {"recommended" in l && l.recommended && (
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
            <img src="/qr-payment.png" alt="PromptPay QR" className="w-[280px] max-w-full" />
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
              <img src={photoOutputUrl} alt="output" className="w-full rounded-xl" />
            </div>
          </div>

          {/* Print section (top) */}
          <div className="max-w-md mx-auto mb-8 p-6 rounded-3xl border border-border bg-card text-center">
            <p className="text-2xl mb-2">🖨️</p>
            <h3 className="font-heading font-bold text-lg mb-3">ปริ้นท์รับเลย</h3>
            <button
              onClick={openPrint}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold hover:scale-[1.02] transition inline-flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" /> ปริ้นท์รับเลย 🖨️
            </button>
          </div>

          {/* Scan to save section (bottom) */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-center font-heading font-bold text-xl mb-5">📲 สแกนเซฟลงมือถือ</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-3xl border border-border bg-card text-center">
                <p className="font-heading font-bold mb-3">📸 เซฟรูปนิ่ง</p>
                {photoQr && (
                  <div className="bg-white p-2 rounded-xl inline-block">
                    <img src={photoQr} alt="QR เซฟรูป" className="w-[200px] h-[200px] block" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3">สแกนรับรูป JPEG</p>
              </div>
              <div className="p-4 rounded-3xl border border-border bg-card text-center">
                <p className="font-heading font-bold mb-3">✨ เซฟ GIF</p>
                {gifQr && (
                  <div className="bg-white p-2 rounded-xl inline-block">
                    <img src={gifQr} alt="QR เซฟ GIF" className="w-[200px] h-[200px] block" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3">สแกนรับ GIF เคลื่อนไหว</p>
              </div>
            </div>
            <p className="text-center text-muted-foreground mt-4" style={{ fontSize: 12 }}>
              ลิงก์นี้ใช้ได้ 24 ชั่วโมง
            </p>
          </div>

          <button
            onClick={() => navigate({ to: "/" })}
            className="block mx-auto mt-10 text-sm text-muted-foreground hover:text-foreground"
          >
            จบ session
          </button>

          {gifOutputUrl && <link rel="prefetch" href={gifOutputUrl} />}

          {/* Print preview modal */}
          {printOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-card max-w-2xl w-full rounded-3xl p-6 shadow-2xl">
                <h3 className="font-heading font-bold text-xl mb-4">ตัวอย่างก่อนปริ้นท์</h3>
                <img src={photoOutputUrl} alt="preview" className="w-full rounded-xl mb-4 border border-border" />
                <p className="text-xs text-muted-foreground mb-4">
                  4×6 นิ้ว · 300 DPI · {cfg?.printOrientation === "portrait" ? "แนวตั้ง" : "แนวนอน"}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPrintOpen(false)}
                    className="flex-1 h-12 rounded-full border border-border font-semibold"
                  >
                    ← กลับ
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
      <div className="aspect-[2/3] mx-auto w-2/3 bg-white rounded-xl p-1 flex gap-1 relative">
        {[0, 1].map((s) => (
          <div key={s} className="flex-1 bg-slate-900 rounded p-1 flex flex-col gap-0.5">
            <div className="h-4 bg-slate-700 rounded-sm mb-0.5" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex-1 bg-muted overflow-hidden rounded-sm">
                {p(i) && <img src={p(i)} alt="" className="w-full h-full object-cover" />}
              </div>
            ))}
            <div className="h-3 bg-slate-700 rounded-sm mt-0.5" />
          </div>
        ))}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-dashed border-slate-400" />
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
  // C
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
