import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { CaptureFlow } from "@/components/CaptureFlow";
import { LAYOUTS, renderLayout, type LayoutId } from "@/lib/composer";
import { loadConfig } from "@/lib/admin-config";
import { paymentSuccess, chime } from "@/lib/audio";
import { FilterPicker } from "@/components/FilterPicker";
import { FILTERS, type FilterKey } from "@/lib/filters";
import { NORMAL_PRICE, PROMO_PRICE, REPRINT_PRICE, promoRemaining, consumePromo } from "@/lib/promo";
import { enqueuePrint, setPrinter } from "@/lib/print-queue";

export const Route = createFileRoute("/session/$id")({
  component: SessionPage,
});

type Step = "format" | "capture" | "uploading" | "filter" | "payment" | "rendering" | "delivery";

function StripIllustration() {
  return (
    <svg viewBox="0 0 200 600" style={{ width: 120, height: "auto" }}>
      <rect x="0" y="0" width="200" height="600" fill="#f5f5f5" stroke="#ddd" strokeWidth="2" rx="8" />
      <rect x="12" y="20" width="78" height="160" fill="#e0e0e0" rx="4" />
      <rect x="12" y="195" width="78" height="160" fill="#e0e0e0" rx="4" />
      <rect x="12" y="370" width="78" height="160" fill="#e0e0e0" rx="4" />
      <line x1="100" y1="10" x2="100" y2="590" stroke="#ccc" strokeWidth="1" strokeDasharray="4 3" />
      <rect x="110" y="20" width="78" height="160" fill="#e0e0e0" rx="4" />
      <rect x="110" y="195" width="78" height="160" fill="#e0e0e0" rx="4" />
      <rect x="110" y="370" width="78" height="160" fill="#e0e0e0" rx="4" />
      <text x="100" y="560" textAnchor="middle" fontSize="14" fill="#999">✂️ ตัดแบ่งได้</text>
    </svg>
  );
}

function FullIllustration() {
  return (
    <svg viewBox="0 0 200 296" style={{ width: 120, height: "auto" }}>
      <rect x="0" y="0" width="200" height="296" fill="#f5f5f5" stroke="#ddd" strokeWidth="2" rx="8" />
      <rect x="10" y="10" width="85" height="128" fill="#e0e0e0" rx="4" />
      <rect x="105" y="10" width="85" height="128" fill="#e0e0e0" rx="4" />
      <rect x="10" y="148" width="85" height="128" fill="#e0e0e0" rx="4" />
      <rect x="105" y="148" width="85" height="128" fill="#e0e0e0" rx="4" />
      <text x="100" y="288" textAnchor="middle" fontSize="11" fill="#999">เต็มแผ่น</text>
    </svg>
  );
}

function CinnamorollIllustration() {
  return (
    <svg viewBox="0 0 200 296" style={{ width: 120, height: "auto" }}>
      <rect x="0" y="0" width="200" height="296" fill="#fde7ee" stroke="#f5b8c8" strokeWidth="2" rx="8" />
      <rect x="12" y="14" width="84" height="76" fill="#fff" rx="8" />
      <rect x="104" y="14" width="84" height="76" fill="#fff" rx="8" />
      <rect x="12" y="100" width="84" height="76" fill="#fff" rx="8" />
      <rect x="104" y="100" width="84" height="76" fill="#fff" rx="8" />
      <rect x="12" y="186" width="84" height="78" fill="#fff" rx="8" />
      <rect x="104" y="186" width="84" height="78" fill="#fff" rx="8" />
      <text x="100" y="284" textAnchor="middle" fontSize="11" fill="#a06a85">🐰 Cinnamoroll</text>
    </svg>
  );
}

function FormatSelect({ onPick, onBack }: { onPick: (l: LayoutId) => void; onBack: () => void }) {
  const cards: { id: LayoutId; title: string; desc: string; render: () => React.ReactNode }[] = [
    { id: "A", title: "แบบแถบ 2x6 💑", desc: "ถ่าย 4 รูป ได้ 2 แถบตัดแบ่งได้", render: () => <StripIllustration /> },
    { id: "B", title: "เต็มแผ่น 4x6 🖼️", desc: "ถ่าย 4 รูป เต็มแผ่น", render: () => <FullIllustration /> },
    { id: "cinnamoroll", title: "ชินนาม่อน 🐰", desc: "ถ่าย 6 รูป กรอบ Cinnamoroll น่ารัก", render: () => <CinnamorollIllustration /> },
  ];
  return (
    <section className="animate-fade-in max-w-3xl mx-auto">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> กลับ
      </button>
      <h1 className="text-3xl font-heading font-bold text-center mb-2">เลือกแบบที่ชอบ</h1>
      <p className="text-center text-muted-foreground mb-6">Pick your format</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c.id)}
            className="rounded-3xl border-2 border-border bg-card p-5 text-left hover:border-primary hover:scale-[1.02] transition flex flex-col items-center"
          >
            <div className="mb-4 flex items-center justify-center">{c.render()}</div>
            <h3 className="font-heading font-bold text-lg mb-1 text-center">{c.title}</h3>
            <p className="text-sm text-muted-foreground text-center">{c.desc}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function SessionPage() {
  const { id } = Route.useParams();
  const [step, setStep] = useState<Step>("format");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [layout, setLayout] = useState<LayoutId>("A");
  const [filter, setFilter] = useState<FilterKey>("none");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [confirming, setConfirming] = useState(false);
  const [paid, setPaid] = useState(false);
  const [photoOutputBlob, setPhotoOutputBlob] = useState<Blob | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasPrintedOnce, setHasPrintedOnce] = useState(false);
  const [printStatus, setPrintStatus] = useState<string>("");
  const upsellIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const upsellOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (!reviewStory && !reviewClip) { toast.error("เลือกอย่างน้อย 1 ข้อนะ"); return; }
    setReviewerActive(true);
    const reviewType = reviewStory && reviewClip ? "both" : reviewStory ? "story_tag" : "clip";
    supabase.from("sessions").update({ review_type: reviewType, review_handle: reviewHandle || null }).eq("id", id).then(() => {});
    chime();
    toast.success("✅ แชร์ปุ๊บ ลดปั๊บ! ราคา " + PROMO_PRICE + ".- 🎉");
  }

  async function handleCaptured(blobs: Blob[]) {
    setStep("uploading");
    try {
      const urls: string[] = [];
      for (let i = 0; i < blobs.length; i++) {
        const path = `${id}/shot-${i + 1}-${Date.now()}.jpg`;
        const { error } = await supabase.storage.from("photos").upload(path, blobs[i], { contentType: "image/jpeg", upsert: true });
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

  async function handleFormatPick(l: LayoutId) {
    setLayout(l);
    await supabase.from("sessions").update({ layout: l }).eq("id", id);
    setStep("capture");
  }

  function backFromCapture() {
    if (confirm("เริ่มถ่ายใหม่เลยนะ?")) setStep("format");
  }

  function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error("render timeout")), ms);
      p.then((v) => { clearTimeout(t); res(v); }).catch((e) => { clearTimeout(t); rej(e); });
    });
  }

  async function backgroundRender(l: LayoutId, urls: string[], filterCss: string): Promise<Blob | null> {
    const tryRender = (timeoutMs: number) => withTimeout(renderLayout(l, urls, filterCss), timeoutMs);
    try { return await tryRender(15000); }
    catch (e) {
      console.error("render attempt 1 failed", e);
      try { return await tryRender(10000); }
      catch (e2) {
        console.error("render attempt 2 failed", e2);
        try { return await renderLayout(l, urls, "none"); }
        catch (e3) { console.error("final fallback render failed", e3); return null; }
      }
    }
  }

  // Build preview thumbnail when entering payment step
  useEffect(() => {
    if (step !== "payment" || photoUrls.length === 0) return;
    let cancelled = false;
    let prev = "";
    renderLayout(layout, photoUrls, FILTERS[filter])
      .then((blob) => {
        if (cancelled) return;
        const u = URL.createObjectURL(blob);
        setPreviewUrl((old) => { prev = old; return u; });
      })
      .catch(() => {});
    return () => { cancelled = true; if (prev) URL.revokeObjectURL(prev); };
  }, [step, layout, photoUrls, filter]);

  async function confirmPayment() {
    setConfirming(true);
    await supabase.from("sessions").update({ payment_status: "checking" }).eq("id", id);
    setTimeout(async () => {
      await supabase.from("sessions").update({ payment_status: "paid" }).eq("id", id);
      if (isPromo) consumePromo();
      setPaid(true);
      paymentSuccess();
      setStep("rendering");
    }, 10000);
  }

  // Render only when step reaches "rendering" — filter is locked by then
  useEffect(() => {
    if (step !== "rendering") return;
    let cancelled = false;
    backgroundRender(layout, photoUrls, FILTERS[filter]).then(async (blob) => {
      if (cancelled) return;
      if (!blob) { setStep("delivery"); return; }
      setPhotoOutputBlob(blob);
      setStep("delivery");
      try {
        const canvas = await blobToCanvas(blob);
        setIsPrinting(true);
        setHasPrintedOnce(true);
        await batchPrint(canvas, copies);
        setIsPrinting(false);
      } catch (e) { console.error(e); setIsPrinting(false); }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          return reject(new Error("no ctx"));
        }
        ctx.drawImage(img, 0, 0);
        const check = ctx.getImageData(
          Math.floor(c.width / 2),
          Math.floor(c.height / 2),
          1,
          1,
        );
        URL.revokeObjectURL(url);
        console.log("blobToCanvas:", c.width, "x", c.height, "center pixel:", check.data);
        resolve(c);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error("image load failed: " + e));
      };
      img.crossOrigin = "anonymous";
      img.src = url;
    });
  }

  function printCanvas(canvas: HTMLCanvasElement): Window | null {
    const dataUrl = canvas.toDataURL("image/jpeg", 1.0);

    const win = window.open(
      "",
      "_blank",
      "width=400,height=600,toolbar=0,menubar=0,location=0,status=0",
    );
    if (!win) {
      alert("กรุณาอนุญาต popup ก่อนนะครับ");
      return null;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>print</title>
<style>
  * {
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
  }
  @page {
    size: 100mm 148mm portrait;
    margin: 0mm !important;
  }
  html {
    margin: 0 !important;
    padding: 0 !important;
    width: 100mm;
    height: 148mm;
  }
  body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100mm;
    height: 148mm;
    overflow: hidden;
    background: white;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  img {
    position: fixed;
    top: 0;
    left: 0;
    width: 100mm !important;
    height: 148mm !important;
    display: block;
    object-fit: fill;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  @media print {
    * {
      margin: 0 !important;
      padding: 0 !important;
    }
    html, body {
      width: 100mm !important;
      height: 148mm !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    img {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100mm !important;
      height: 148mm !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  }
</style>
</head>
<body>
<img id="printImg" src="${dataUrl}">
<script>
  var img = document.getElementById('printImg');
  function doPrint() {
    window.focus();
    window.print();
    setTimeout(function() { window.close(); }, 3000);
  }
  if (img.complete && img.naturalWidth > 0) {
    setTimeout(doPrint, 300);
  } else {
    img.onload = function() { setTimeout(doPrint, 300); };
    img.onerror = function() { alert('โหลดรูปไม่ได้ กรุณาลองใหม่'); };
  }
<\/script>
</body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
    return win;
  }

  function markPrintFinished() { setIsPrinting(false); }

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

  return (
    <main className="min-h-screen px-4 py-6 max-w-5xl mx-auto">
      {step !== "delivery" && step !== "format" && (
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> หน้าแรก
        </Link>
      )}

      {step === "format" && (
        <FormatSelect onPick={handleFormatPick} onBack={() => { window.history.back(); }} />
      )}

      {step === "capture" && (
        <CaptureFlow
          totalShots={LAYOUTS.find((l) => l.id === layout)?.needsCount ?? 4}
          aspectRatio={layout === "A" ? 9 / 16 : layout === "cinnamoroll" ? 521 / 465 : 3 / 4}
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

      {step === "filter" && (
        <FilterPicker
          photos={photoUrls}
          initialFilter={filter}
          layout={layout}
          onNext={(f) => { setFilter(f); setStep("payment"); }}
          onBack={() => setStep("capture")}
        />
      )}

      {step === "payment" && (
        <section className="animate-fade-in max-w-md mx-auto text-center">
          <h2 className="text-2xl font-heading font-bold mb-2">สแกน QR จ่ายได้เลย</h2>
          <p className="text-muted-foreground mb-3 text-sm">PromptPay รับทุกธนาคาร</p>

          {previewUrl && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <img
                src={previewUrl}
                alt="preview"
                style={{ maxHeight: 200, width: "auto", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)" }}
              />
            </div>
          )}

          {!reviewerActive && promoLeft <= 0 && (
            <div className="mb-4 px-4 text-left">
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
                <button onClick={activateReviewerPromo} className="w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                  รับส่วนลดเลย! →
                </button>
              </div>
            </div>
          )}
          {reviewerActive && (
            <div className="mb-4 px-4">
              <div className="rounded-2xl bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-500 font-semibold">
                ✅ ขอบคุณล่วงหน้าเลยนะ! ราคาพิเศษ {PROMO_PRICE}.- 🎉
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4 px-4">
            <button
              onClick={() => !confirming && setCopies(1)}
              disabled={confirming}
              className={`rounded-full py-3 px-3 font-semibold text-sm transition ${
                copies === 1 ? "bg-primary text-primary-foreground shadow-lg" : "border border-border text-muted-foreground hover:border-primary/60"
              }`}
            >
              <div>1 แผ่น</div>
              <div className="text-xs opacity-80">{basePrice}.-</div>
            </button>
            <button
              onClick={() => !confirming && setCopies(2)}
              disabled={confirming}
              className={`rounded-full py-3 px-3 font-semibold text-sm transition ${
                copies === 2 ? "bg-primary text-primary-foreground shadow-lg" : "border border-border text-muted-foreground hover:border-primary/60"
              }`}
            >
              <div>2 แผ่น 🔥</div>
              <div className="text-xs opacity-80">{basePrice + REPRINT_PRICE}.-</div>
            </button>
          </div>

          <div className="bg-white p-3 rounded-2xl inline-block shadow-2xl mb-4">
            <img src="/qr-payment.png" alt="PromptPay QR" className="w-[200px] max-w-full" />
          </div>

          <p className="font-bold text-lg">นาย พงศกร อาจหาญ</p>
          <p className="text-xs text-muted-foreground mb-1">รับเงินได้จากทุกธนาคาร</p>
          <p className="text-2xl font-heading font-bold text-primary mb-4">{price} ฿</p>

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
              <div className="py-6">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
                <p className="font-semibold">กำลังเช็คให้นะ รอแปปนึง...</p>
                <p className="text-sm text-muted-foreground mt-1">ใช้เวลาประมาณ 10 วินาที</p>
              </div>
            ) : (
              <div className="py-6">
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
