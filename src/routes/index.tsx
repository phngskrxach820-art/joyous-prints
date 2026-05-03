import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Instructions } from "@/components/Instructions";
import { FormatCard, FORMAT_META } from "@/components/FormatCard";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { click } from "@/lib/audio";
import { promoRemaining, PROMO_LIMIT, NORMAL_PRICE } from "@/lib/promo";
import QRCode from "qrcode";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Heng Photos" },
      { name: "description", content: "Photo Booth by Heng" },
    ],
  }),
  component: Home,
});

const SLIDES = [
  { emoji: "🔥", title: "5 คิวแรกของวัน ลดเหลือ 49.-", body: "จากราคาปกติ 69.- · วันนี้เท่านั้น!" },
  { emoji: "📱", title: "ตามมาจากเพจ/Influencer?", body: "กดรับส่วนลดทันที เหลือแค่ 49.-" },
  { emoji: "🖨️", title: "ปริ้นท์แผ่นที่ 2 เพิ่มเพียง 30.-", body: "พิมพ์แบ่งให้เพื่อนได้เลย" },
];

function Home() {
  const [view, setView] = useState<"home" | "instructions">("home");
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);
  const [card, setCard] = useState(0);
  const [remaining, setRemaining] = useState(PROMO_LIMIT);
  const [tutorialQr, setTutorialQr] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => { setRemaining(promoRemaining()); }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const url = import.meta.env.VITE_TUTORIAL_URL as string | undefined;
    if (!url) return;
    QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setTutorialQr).catch(() => {});
  }, []);

  async function start() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .insert({ price: NORMAL_PRICE })
      .select("id")
      .single();
    setLoading(false);
    if (error || !data) {
      toast.error("เปิด session ไม่ได้");
      return;
    }
    navigate({ to: "/session/$id", params: { id: data.id } });
  }

  if (view === "instructions") {
    return <Instructions onBack={() => setView("home")} onContinue={start} />;
  }

  const promoFull = remaining <= 0;

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 mb-4">
          <Camera className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-body">
            Heng Photos
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight leading-tight">
          พร้อมถ่ายรูป
          <br />
          แล้วหรือยัง? 📷
        </h1>
      </div>

      {/* Promo banner slider */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 border border-border mb-4 h-32">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 px-6 flex flex-col items-center justify-center text-center transition-opacity duration-500"
            style={{ opacity: i === slide ? 1 : 0 }}
          >
            <p className="text-xl md:text-2xl font-heading font-bold mb-1">
              {s.emoji} {s.title}
            </p>
            <p className="text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`h-1.5 rounded-full transition-all ${i === slide ? "w-6 bg-primary" : "w-1.5 bg-foreground/30"}`}
              aria-label={`slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Daily promo counter */}
      <div className="text-center mb-6">
        {promoFull ? (
          <span className="inline-block px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm">
            โปรวันนี้เต็มแล้ว ราคาปกติ {NORMAL_PRICE}.-
          </span>
        ) : (
          <span className="inline-block px-4 py-2 rounded-full bg-green-500/20 text-green-500 text-sm font-semibold animate-pulse-soft">
            🔥 เหลืออีก {remaining} สิทธิ์โปรวันนี้!
          </span>
        )}
      </div>

      {/* Format carousel */}
      <div className="relative mb-6">
        <div className="md:hidden relative">
          <div className="overflow-hidden rounded-3xl">
            <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${card * 100}%)` }}>
              {FORMAT_META.map((m) => (
                <div key={m.id} className="w-full shrink-0 px-1">
                  <FormatCard meta={m} onSelect={() => setView("instructions")} />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setCard((c) => Math.max(0, c - 1))}
            className="absolute left-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-card/80 border border-border flex items-center justify-center"
            aria-label="prev"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCard((c) => Math.min(FORMAT_META.length - 1, c + 1))}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-card/80 border border-border flex items-center justify-center"
            aria-label="next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="hidden md:grid md:grid-cols-2 gap-4">
          {FORMAT_META.map((m) => (
            <FormatCard key={m.id} meta={m} onSelect={() => setView("instructions")} />
          ))}
        </div>
      </div>

      <div className="flex justify-center mb-10">
        <button
          onClick={() => { click(); setView("instructions"); }}
          disabled={loading}
          className="h-14 px-10 rounded-full bg-primary text-primary-foreground font-semibold text-lg shadow-xl hover:scale-[1.03] transition-transform disabled:opacity-60"
        >
          เริ่มถ่ายเลย! →
        </button>
      </div>

      {/* Tutorial QR */}
      {tutorialQr && (
        <section className="text-center pb-8">
          <h2 className="text-xl font-heading font-bold mb-1">ไม่รู้จะเริ่มยังไง? 🤔</h2>
          <p className="text-sm text-muted-foreground mb-3">ดูคลิปสั้น 30 วินาที</p>
          <div className="inline-block bg-white p-3 rounded-2xl shadow-lg">
            <img src={tutorialQr} alt="Tutorial QR" width={160} height={160} loading="lazy" />
          </div>
        </section>
      )}
    </main>
  );
}
