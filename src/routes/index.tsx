import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Instructions } from "@/components/Instructions";
import { FORMAT_META } from "@/components/FormatCard";
import { Camera } from "lucide-react";
import { click } from "@/lib/audio";
import { promoRemaining, PROMO_LIMIT, NORMAL_PRICE, PROMO_PRICE } from "@/lib/promo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Heng Photobooth" },
      { name: "description", content: "Photo Booth by Heng" },
    ],
  }),
  component: Home,
});

const SLIDES = [
  { emoji: "🔥", title: "5 คิวแรกของวัน ลดเหลือ 49.-", body: "จากราคาปกติ 69.- · วันนี้เท่านั้น!" },
  { emoji: "📱", title: "รีวิวให้เรา รับส่วนลดทันที", body: "แท็กร้าน หรือทำคลิป ลดเหลือ 49.-" },
  { emoji: "🖨️", title: "ปริ้นท์แผ่นที่ 2 เพิ่มเพียง 30.-", body: "พิมพ์แบ่งให้เพื่อนได้เลย" },
];

function Home() {
  const [view, setView] = useState<"home" | "instructions">("home");
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);
  const [fmtIdx, setFmtIdx] = useState(0);
  const [remaining, setRemaining] = useState(PROMO_LIMIT);
  const navigate = useNavigate();

  useEffect(() => { setRemaining(promoRemaining()); }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setFmtIdx((i) => (i + 1) % FORMAT_META.length), 2500);
    return () => clearInterval(t);
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
  const fmt = FORMAT_META[fmtIdx];

  return (
    <main
      className="px-4 max-w-3xl mx-auto flex flex-col"
      style={{ height: "100vh", paddingTop: "1rem", paddingBottom: "1rem" }}
    >
      {/* 25vh — brand + promo banner */}
      <div className="flex flex-col" style={{ height: "25vh" }}>
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/50">
            <Camera className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-body">
              Heng Photobooth
            </span>
          </div>
        </div>
        <div className="relative flex-1 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 border border-border">
          {SLIDES.map((s, i) => (
            <div
              key={i}
              className="absolute inset-0 px-6 flex flex-col items-center justify-center text-center transition-opacity duration-500"
              style={{ opacity: i === slide ? 1 : 0 }}
            >
              <p className="text-lg md:text-2xl font-heading font-bold mb-1">{s.emoji} {s.title}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === slide ? "w-6 bg-primary" : "w-1.5 bg-foreground/30"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 45vh — format slideshow (view-only) */}
      <div className="relative my-2 rounded-3xl overflow-hidden bg-card/50 border border-border" style={{ height: "45vh" }}>
        <div
          key={fmt.id}
          className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in p-4"
        >
          <div className="text-7xl md:text-8xl mb-3">{fmt.emoji}</div>
          <p className="text-xl md:text-2xl font-heading font-bold mb-1">{fmt.title}</p>
          <p className="text-xs md:text-sm text-muted-foreground">{fmt.shotsLabel}</p>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {FORMAT_META.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === fmtIdx ? "w-6 bg-primary" : "w-1.5 bg-foreground/30"}`}
            />
          ))}
        </div>
      </div>

      {/* 10vh — promo counter */}
      <div className="flex items-center justify-center" style={{ height: "10vh" }}>
        {promoFull ? (
          <span className="inline-block px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm">
            โปรวันนี้เต็มแล้ว · ราคาปกติ {NORMAL_PRICE}.-
          </span>
        ) : (
          <span className="inline-block px-4 py-2 rounded-full bg-green-500/20 text-green-500 text-sm font-semibold animate-pulse-soft">
            🔥 เหลืออีก {remaining} สิทธิ์โปรวันนี้! ({PROMO_PRICE}.-)
          </span>
        )}
      </div>

      {/* 20vh — CTA */}
      <div className="flex items-center justify-center" style={{ height: "20vh" }}>
        <button
          onClick={() => { click(); setView("instructions"); }}
          disabled={loading}
          className="h-14 px-12 rounded-full bg-primary text-primary-foreground font-semibold text-lg shadow-xl hover:scale-[1.03] transition-transform disabled:opacity-60"
        >
          เริ่มเลย →
        </button>
      </div>
    </main>
  );
}
