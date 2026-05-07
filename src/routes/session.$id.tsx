import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { CaptureFlow } from "@/components/CaptureFlow";
import { LAYOUTS, renderLayout, type LayoutId } from "@/lib/composer";
import { loadConfig } from "@/lib/admin-config";
import { paymentSuccess, chime } from "@/lib/audio";
import { ThemePicker } from "@/components/ThemePicker";
import { FilterPicker } from "@/components/FilterPicker";
import { FILTERS, type DesignId, type FilterKey } from "@/components/PhotoboothOverlay";
import { NORMAL_PRICE, PROMO_PRICE, REPRINT_PRICE, promoRemaining, consumePromo } from "@/lib/promo";
import { enqueuePrint, setPrinter } from "@/lib/print-queue";

export const Route = createFileRoute("/session/$id")({
  component: SessionPage,
});

type Step = "theme" | "capture" | "uploading" | "filter" | "payment" | "rendering" | "delivery";

function SessionPage() {
  const { id } = Route.useParams();
  const [step, setStep] = useState<Step>("theme");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [layout, setLayout] = useState<LayoutId>("A");
  const [designId, setDesignId] = useState<DesignId>("strip-korean-mono");
  const [filter, setFilter] = useState<FilterKey>("none");

  const [confirming, setConfirming] = useState(false);
  const [paid, setPaid] = useState(false);
  const [photoOutputBlob, setPhotoOutputBlob] = useState<Blob | null>(null);
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
    chime();
    toast.success("✅ แชร์ปุ๊บ ลดปั๊บ! ราคา " + PROMO_PRICE + ".- 🎉");
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

  async function handleThemePick(result: { layout: "A" | "B"; designId: DesignId; filter: FilterKey }) {
    setLayout(result.layout);
    setDesignId(result.designId);
    setFilter(result.filter);
    await supabase.from("sessions").update({ layout: result.layout }).eq("id", id);
    setStep("capture");
  }

  function backFromCapture() {
    if (confirm("เริ่มถ่ายใหม่เลยนะ?")) {
      setStep("theme");
    }
  }

  // Background: render the JPEG collage with timeout + retry. GIF rendered too (kept for later use).
  function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error("render timeout")), ms);
      p.then((v) => { clearTimeout(t); res(v); }).catch((e) => { clearTimeout(t); rej(e); });
    });
  }

  async function backgroundRender(l: LayoutId, urls: string[], filterCss: string): Promise<Blob | null> {
    const tryRender = (timeoutMs: number) => {
      const effectiveDesignId = designId ?? (l === "A" ? "strip-bunny-cute" : "full-korean-cafe");
      return withTimeout(renderLayout(l, urls, filterCss, effectiveDesignId), timeoutMs);
    };
    try {
      return await tryRender(15000);
    } catch (e) {
      console.error("render attempt 1 failed", e);
      try {
        return await tryRender(10000);
      } catch (e2) {
        console.error("render attempt 2 failed", e2);
        try {
          return await renderLayout(l, urls, "none", designId ?? (l === "A" ? "strip-bunny-cute" : "full-korean-cafe"));
        } catch (e3) {
          console.error("final fallback render failed", e3);
          return null;
        }
      }
    }
  }

  async function confirmPayment() {
    setConfirming(true);
    await supabase.from("sessions").update({ payment_status: "checking" }).eq("id", id);

    const renderPromise = backgroundRender(layout, photoUrls, FILTERS[filter]);

    setTimeout(async () => {
      await supabase.from("sessions").update({ payment_status: "paid" }).eq("id", id);
      if (isPromo) consumePromo();
      setPaid(true);
      paymentSuccess();
      setStep("rendering");
      const blob = await renderPromise;
      if (!blob) {
        // Proceed silently to delivery; allow user to retry print.
        setStep("delivery");
        return;
      }
      setPhotoOutputBlob(blob);
      setStep("delivery");

      // Auto-print based on copies chosen
      try {
        const canvas = await blobToCanvas(blob);
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

  function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
    const url = URL.createObjectURL(blob);
    return urlToCanvas(url).finally(() => URL.revokeObjectURL(url));
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
    setPrinter(printCanvas);
    setPrintStatus(copies > 1 ? `🖨️ เพิ่มเข้าคิว ${copies} แผ่น...` : "🖨️ เพิ่มเข้าคิวพิมพ์...");
    enqueuePrint(canvas, id, copies, layout);
    setPrintStatus(copies > 1 ? `✅ ส่งเข้าคิวแล้ว ${copies} แผ่น!` : "✅ ส่งเข้าคิวแล้ว!");
  }

  async function doPrintOnce() {
    try {
      if (!photoOutputBlob) throw new Error("no rendered image");
      const canvas = await blobToCanvas(photoOutputBlob);
      setPrinter(printCanvas);
      enqueuePrint(canvas, id, 1, layout);
      setTimeout(markPrintFinished, 3000);
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
      {step !== "delivery" && (
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> หน้าแรก
        </Link>
      )}

      {step === "capture" && (
        <CaptureFlow
          totalShots={LAYOUTS.find((l) => l.id === layout)?.needsCount ?? 4}
          aspectRatio={layout === "A" ? 9 / 16 : 3 / 4}
          design={designId}
          filter={filter}
          onComplete={handleCaptured}
          onBack={backFromCapture}
        />
      )}

      {step === "uploading" && (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">กำลังอัปโหลดรูปนะ...</p>
        </div>
      )}

      {step === "theme" && (
        <ThemePicker
          onBack={() => { window.history.back(); }}
          onPick={handleThemePick}
        />
      )}

      {step === "filter" && (
        <FilterPicker
          photos={photoUrls}
          initialFilter={filter}
          layout={layout === "B" ? "B" : "A"}
          onNext={(f) => { setFilter(f); setStep("payment"); }}
          onBack={() => setStep("capture")}
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
                <p className="font-heading font-bold text-center">แชร์ปุ๊บ ลดปั๊บ! 🔥</p>
                <p className="text-xs text-muted-foreground mb-3 text-center">ลดเหลือ {PROMO_PRICE}.- ทันที</p>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input type="checkbox" checked={reviewStory} onChange={(e) => setReviewStory(e.target.checked)} />
                  <span className="text-sm">โพสต์/Story แท็กร้านให้เรา</span>
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
          <p className="text-lg">กำลังสั่งปริ้น...รอสักครู่</p>
          <p className="text-sm text-muted-foreground">เกือบเสร็จแล้ว ✨</p>
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

          {layout === "A" && (
            <p className="mb-6 text-base font-semibold text-amber-600 dark:text-amber-400">
              ตัดตามเส้นประตรงกลางได้เลย ✂️
            </p>
          )}

          {!hasPrintedOnce && photoOutputBlob && (
            <button
              onClick={handlePrintClick}
              disabled={isPrinting}
              style={{ width: "calc(100% - 32px)", marginLeft: 16, marginRight: 16 }}
              className="h-14 rounded-full bg-primary text-primary-foreground font-semibold text-lg shadow-lg hover:scale-[1.02] transition mb-4 disabled:opacity-60"
            >
              🖨️ สั่งพิมพ์
            </button>
          )}

          <Link
            to="/"
            style={{ width: "calc(100% - 32px)", marginLeft: 16, marginRight: 16 }}
            className="inline-flex items-center justify-center h-14 rounded-full border-2 border-primary text-primary font-semibold text-lg hover:bg-primary/10 transition"
          >
            🏠 กลับหน้าแรก
          </Link>
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
