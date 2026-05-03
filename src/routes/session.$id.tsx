import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Loader2, Printer, Sparkles, Star, Check } from "lucide-react";
import { CaptureFlow } from "@/components/CaptureFlow";
import { LAYOUTS, renderLayout, renderLayoutD, type LayoutId } from "@/lib/composer";
import { loadConfig } from "@/lib/admin-config";
import { paymentSuccess } from "@/lib/audio";
import { FormatCard, FORMAT_META } from "@/components/FormatCard";
import { ThemePicker } from "@/components/ThemePicker";
// frame catalog accessed inside ThemePicker
import { NORMAL_PRICE, PROMO_PRICE, REPRINT_PRICE, promoRemaining, consumePromo } from "@/lib/promo";
import QRCode from "qrcode";

export const Route = createFileRoute("/session/$id")({
  component: SessionPage,
});

type Step = "format" | "theme" | "capture" | "uploading" | "filter" | "payment" | "rendering" | "delivery";

type FilterId = "none" | "film" | "soft" | "bw" | "vintage";
const FILTERS: Record<FilterId, { label: string; css: string }> = {
  none:    { label: "ปกติ",       css: "none" },
  film:    { label: "ฟิล์ม 🎞️",   css: "sepia(30%) contrast(95%) brightness(105%) saturate(85%)" },
  soft:    { label: "นุ่มๆ 🌸",   css: "brightness(110%) saturate(80%) contrast(90%) hue-rotate(5deg)" },
  bw:      { label: "ขาวดำ 🖤",   css: "grayscale(100%) contrast(105%)" },
  vintage: { label: "วินเทจ 🟤",  css: "sepia(50%) brightness(95%) contrast(90%) saturate(75%)" },
};
const FILTER_ORDER: FilterId[] = ["none", "film", "soft", "bw", "vintage"];

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
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasPrintedOnce, setHasPrintedOnce] = useState(false);
  const [printStatus, setPrintStatus] = useState<string>("");
  const upsellIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const upsellOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reviewer promo
  const [reviewStory, setReviewStory] = useState(false);
  const [reviewClip, setReviewClip] = useState(false);
  const [reviewHandle, setReviewHandle] = useState("");
  const [reviewerActive, setReviewerActive] = useState(false);

  useEffect(() => {
    return () => {
      if (upsellIntervalRef.current) clearInterval(upsellIntervalRef.current);
      if (upsellOpenTimerRef.current) clearTimeout(upsellOpenTimerRef.current);
    };
  }, []);

  const cfg = typeof window !== "undefined" ? loadConfig() : null;
  const _cfgPrice = cfg?.price ?? 69;
  const [copies, setCopies] = useState<1 | 2>(1);
  const promoLeft = typeof window !== "undefined" ? promoRemaining() : 0;
  const isPromo = promoLeft > 0 || reviewerActive;
  const basePrice = isPromo ? PROMO_PRICE : NORMAL_PRICE;
  const price = copies === 2 ? basePrice + REPRINT_PRICE : basePrice;

  function activateReviewerPromo() {
    if (!reviewStory && !reviewClip) {
      toast.error("เลือกอย่างน้อย 1 ข้อนะ");
      return;
    }
    setReviewerActive(true);
    const reviewType = reviewStory && reviewClip ? "both" : reviewStory ? "story_tag" : "clip";
    supabase
      .from("sessions")
      .update({ review_type: reviewType, review_handle: reviewHandle || null })
      .eq("id", id)
      .then(() => {});
    toast.success("ขอบคุณล่วงหน้าเลยนะ! ราคาพิเศษ 49.- 🎉");
  }

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
    setStep(l === "A" || l === "B" ? "theme" : "capture");
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
      if (isPromo) consumePromo();
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

      // Auto-print based on copies chosen
      try {
        const canvas = await urlToCanvas(photoUrl);
        setIsPrinting(true);
        setHasPrintedOnce(true);
        await batchPrint(canvas, copies);
        setIsPrinting(false);
      } catch (e) {
        console.error(e);
        setIsPrinting(false);
      }
    }, 10000);
  }

  function urlToCanvas(url: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0);
        resolve(c);
      };
      img.onerror = () => reject(new Error("image load failed"));
      img.src = url;
    });
  }

  function printCanvas(canvas: HTMLCanvasElement): Window | null {
    const dataUrl = canvas.toDataURL("image/jpeg", 1.0);
    const win = window.open("", "_blank");
    if (!win) return null;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page {
    size: 100mm 148mm portrait;
    margin: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  html, body {
    width: 100mm;
    height: 148mm;
    overflow: hidden;
    background: white;
  }
  img {
    width: 100mm !important;
    height: 148mm !important;
    display: block;
    object-fit: fill;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
  @media print {
    html, body { width: 100mm; height: 148mm; }
    img { width: 100mm !important; height: 148mm !important; }
  }
</style>
</head>
<body>
<img src="${dataUrl}">
<script>
  window.addEventListener('load', () => {
    setTimeout(() => {
      window.focus();
      window.print();
      setTimeout(() => window.close(), 1500);
    }, 600);
  });
<\/script>
</body>
</html>`);
    win.document.close();
    return win;
  }

  function markPrintFinished() {
    setIsPrinting(false);
  }

  async function batchPrint(canvas: HTMLCanvasElement, copies: number) {
    for (let i = 0; i < copies; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 4000));
      setPrintStatus(copies > 1 ? `🖨️ กำลังพิมพ์แผ่นที่ ${i + 1}...` : "🖨️ กำลังพิมพ์...");
      printCanvas(canvas);
    }
    setPrintStatus(copies > 1 ? `✅ พิมพ์ครบ ${copies} แผ่นแล้ว!` : "✅ สั่งพิมพ์แล้ว!");
  }

  async function doPrintOnce() {
    try {
      const canvas = await urlToCanvas(photoOutputUrl);
      const win = printCanvas(canvas);
      if (win) {
        try {
          win.addEventListener("afterprint", markPrintFinished);
        } catch {
          // cross-origin; rely on safety timer
        }
      }
      // safety fallback
      setTimeout(markPrintFinished, 12000);
    } catch (e) {
      console.error(e);
      toast.error("เปิดหน้าปริ้นท์ไม่ได้");
      setIsPrinting(false);
    }
  }

  async function handlePrintClick() {
    setIsPrinting(true);
    setHasPrintedOnce(true);
    await doPrintOnce();
  }

  // (legacy upsell removed — copies chosen at payment now)

  return (
    <main className="min-h-screen px-4 py-6 max-w-5xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> หน้าแรก
      </Link>

      {step === "capture" && (
        <CaptureFlow
          totalShots={LAYOUTS.find((l) => l.id === layout)?.needsCount ?? 4}
          aspectRatio={layout === "A" ? 9 / 16 : 3 / 4}
          onComplete={handleCaptured}
          onBack={backFromCapture}
        />
      )}

      {step === "filter" && (
        <section className="animate-fade-in">
          <button
            onClick={backFromFilter}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> ถ่ายใหม่
          </button>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-2">เลือกโทนสีที่ชอบ 🎨</h2>
          <p className="text-muted-foreground mb-6">ฟิลเตอร์จะถูกใส่ในทุกรูปเลย</p>

          <div className="flex gap-3 overflow-x-auto pb-3 mb-6 -mx-4 px-4">
            {FILTER_ORDER.map((fid) => {
              const f = FILTERS[fid];
              const selected = filter === fid;
              return (
                <button
                  key={fid}
                  onClick={() => setFilter(fid)}
                  className={`relative flex-shrink-0 rounded-2xl border-2 overflow-hidden transition-all ${
                    selected ? "border-primary scale-[1.05]" : "border-border hover:border-primary/50"
                  }`}
                  style={{ width: 80 }}
                >
                  <div
                    className="w-[80px] h-[100px] bg-muted overflow-hidden"
                    style={{ filter: f.css }}
                  >
                    {photoUrls[0] && (
                      <img src={photoUrls[0]} alt={f.label} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="px-1 py-1.5 text-[11px] font-semibold text-center bg-card">
                    {f.label}
                  </div>
                  {selected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Live preview grid — bigger portrait thumbs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {photoUrls.map((u, i) => (
              <div key={i} className="aspect-[3/4] bg-muted rounded-xl overflow-hidden shadow-md">
                <img
                  src={u}
                  alt={`รูปที่ ${i + 1}`}
                  className="w-full h-full object-cover transition-[filter] duration-200"
                  style={{ filter: FILTERS[filter].css }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep("payment")}
            className="w-full h-14 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:scale-[1.01] transition"
          >
            ใช้ฟิลเตอร์นี้เลย →
          </button>
        </section>
      )}

      {step === "uploading" && (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">กำลังอัปโหลดรูปนะ...</p>
        </div>
      )}

      {step === "format" && (
        <section className="animate-fade-in flex flex-col" style={{ minHeight: "calc(100vh - 96px)" }}>
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-1">อยากได้แบบไหน?</h2>
          <p className="text-sm text-muted-foreground mb-1">เลือกฟอร์แมตสำหรับปริ้นท์</p>
          <p className="text-xs text-muted-foreground mb-4">✨ ทุกแบบจะได้ GIF เคลื่อนไหวแถมไปด้วยฟรี!</p>

          <div className="grid sm:grid-cols-2 gap-3 flex-1 items-stretch">
            {FORMAT_META.map((m) => (
              <div key={m.id} style={{ maxHeight: "42vh" }} className="flex">
                <div className="w-full">
                  <FormatCard
                    meta={m}
                    selected={layout === m.id}
                    onSelect={(id) => chooseLayout(id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {step === "theme" && (layout === "A" || layout === "B") && (
        <ThemePicker
          format={layout}
          onBack={() => setStep("format")}
          onPick={() => setStep("capture")}
        />
      )}

      {step === "payment" && (
        <section className="animate-fade-in max-w-md mx-auto text-center">
          <h2 className="text-3xl font-heading font-bold mb-2">สแกน QR จ่ายได้เลย</h2>
          <p className="text-muted-foreground mb-4">PromptPay รับทุกธนาคาร</p>

          {/* Layout preview */}
          <div className="mb-4 px-4">
            <FormatPreview id={layout} photos={photoUrls} />
          </div>

          {/* Reviewer promo */}
          {!reviewerActive && promoLeft <= 0 && (
            <div className="mb-5 px-4 text-left">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="font-heading font-bold mb-3 text-center">รีวิวให้เราแลกส่วนลดได้เลย! 📱</p>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input type="checkbox" checked={reviewStory} onChange={(e) => setReviewStory(e.target.checked)} />
                  <span className="text-sm">แท็กร้านใน Story/Post</span>
                </label>
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input type="checkbox" checked={reviewClip} onChange={(e) => setReviewClip(e.target.checked)} />
                  <span className="text-sm">ทำคลิปเกี่ยวกับ Photobooth นี้</span>
                </label>
                <input
                  type="text"
                  value={reviewHandle}
                  onChange={(e) => setReviewHandle(e.target.value)}
                  placeholder="@your_handle"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm mb-3"
                />
                <p className="text-[11px] text-muted-foreground mb-2 text-center">IG / TikTok ของคุณ</p>
                <button
                  onClick={activateReviewerPromo}
                  className="w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
                >
                  รับส่วนลดเลย! →
                </button>
              </div>
            </div>
          )}
          {reviewerActive && (
            <div className="mb-5 px-4">
              <div className="rounded-2xl bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-500 font-semibold">
                ✅ ขอบคุณล่วงหน้าเลยนะ! ราคาพิเศษ {PROMO_PRICE}.- 🎉
              </div>
            </div>
          )}

          {/* Copies toggle */}
          <div className="grid grid-cols-2 gap-3 mb-5 px-4">
            <button
              onClick={() => !confirming && setCopies(1)}
              disabled={confirming}
              className={`rounded-full py-3 px-3 font-semibold text-sm transition ${
                copies === 1
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "border border-border text-muted-foreground hover:border-primary/60"
              }`}
            >
              <div>1 แผ่น</div>
              <div className="text-xs opacity-80">{basePrice}.-</div>
            </button>
            <button
              onClick={() => !confirming && setCopies(2)}
              disabled={confirming}
              className={`rounded-full py-3 px-3 font-semibold text-sm transition ${
                copies === 2
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "border border-border text-muted-foreground hover:border-primary/60"
              }`}
            >
              <div>2 แผ่น 🔥 ประหยัดกว่า!</div>
              <div className="text-xs opacity-80">{basePrice + REPRINT_PRICE}.- (รวมพิมพ์ซ้ำ)</div>
            </button>
          </div>

          <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl mb-6">
            <img src="/qr-payment.png" alt="PromptPay QR" className="w-[280px] max-w-full" />
          </div>

          <p className="font-bold text-xl">นาย พงศกร อาจหาญ</p>
          <p className="text-sm text-muted-foreground mb-2">รับเงินได้จากทุกธนาคาร</p>
          <p className="text-3xl font-heading font-bold text-primary mb-8">{price} ฿</p>

          <div>
            {!confirming ? (
              <button
                onClick={confirmPayment}
                style={{ width: "calc(100% - 32px)", marginLeft: 16, marginRight: 16 }}
                className="h-14 rounded-full bg-green-600 text-white font-semibold text-lg hover:bg-green-700 transition"
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
          </div>
        </section>
      )}

      {step === "rendering" && (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Sparkles className="h-12 w-12 animate-pulse-soft text-primary" />
          <p className="text-lg">กำลังจัดรูปสวยๆ ให้นะ...</p>
        </div>
      )}

      {step === "delivery" && (
        <section className="animate-fade-in max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-24 w-24 text-green-500 animate-pop" />
          </div>
          <h2 className="text-3xl font-heading font-bold mb-8">สั่งพิมพ์เรียบร้อยแล้ว 🎉</h2>

          {(isPrinting || printStatus) && (
            <p className={`mb-6 text-base font-semibold text-primary ${isPrinting ? "animate-pulse" : ""}`}>
              {printStatus || "🖨️ กำลังพิมพ์..."}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-3xl border border-border bg-card text-center">
              <p className="font-heading font-bold mb-3">📸 เซฟรูปนิ่ง</p>
              {photoQr && (
                <div className="bg-white p-2 rounded-xl inline-block">
                  <img src={photoQr} alt="QR เซฟรูป" className="w-[200px] h-[200px] block" />
                </div>
              )}
            </div>
            <div className="p-4 rounded-3xl border border-border bg-card text-center">
              <p className="font-heading font-bold mb-3">✨ เซฟ GIF</p>
              {gifQr && (
                <div className="bg-white p-2 rounded-xl inline-block">
                  <img src={gifQr} alt="QR เซฟ GIF" className="w-[200px] h-[200px] block" />
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-muted-foreground" style={{ fontSize: 12 }}>
            ⏰ ลิงก์ใช้ได้ 24 ชั่วโมง
          </p>

          {gifOutputUrl && <link rel="prefetch" href={gifOutputUrl} />}
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
