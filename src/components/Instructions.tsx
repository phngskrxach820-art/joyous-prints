import { ArrowLeft, Camera, Sparkles, QrCode } from "lucide-react";
import thaiQrIcon from "@/assets/icon-thaiqr.png";
import { click } from "@/lib/audio";

type Props = {
  onBack: () => void;
  onContinue: () => void;
};

const steps = [
  {
    icon: Camera,
    title: "เดินเข้ากรอบ แล้วยิ้มได้เลย",
    body: "ระบบนับ 5-4-3-2-1 แล้วถ่ายให้เอง ถ่ายทั้งหมด 4 รูปติดกัน",
    visual: (
      <div className="aspect-square w-full rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-4xl font-bold text-primary">
        5 4 3 2 1
      </div>
    ),
  },
  {
    icon: Sparkles,
    title: "อยากได้แบบไหน?",
    body: "เลือกได้เลยว่าจะเอา 2 แถบแบ่งเพื่อน คอลลาจเต็มแผ่น ฟิล์มสตริป หรือ GIF",
    visual: (
      <div className="aspect-square w-full rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center gap-2 p-4">
        <div className="flex-1 aspect-[2/3] rounded-lg bg-card/80 border border-border" />
        <div className="flex-1 aspect-[2/3] rounded-lg bg-primary border-2 border-primary scale-110 shadow-lg" />
        <div className="flex-1 aspect-[2/3] rounded-lg bg-card/80 border border-border" />
      </div>
    ),
  },
  {
    icon: QrCode,
    title: "สแกน QR จ่าย แล้วรับรูปได้เลย",
    body: "จ่ายผ่าน PromptPay ได้ทุกธนาคาร รับรูปลงมือถือหรือปริ้นท์รับได้เลย",
    visual: (
      <div className="aspect-square w-full rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center p-6">
        <img
          src={thaiQrIcon}
          alt="Thai QR PromptPay"
          className="w-3/4 h-3/4 object-contain drop-shadow-xl"
        />
      </div>
    ),
  },
];

export function Instructions({ onBack, onContinue }: Props) {
  return (
    <main className="min-h-screen px-4 py-8 md:py-12 max-w-6xl mx-auto animate-fade-in">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition"
      >
        <ArrowLeft className="h-4 w-4" /> กลับ
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-3">วิธีถ่าย ง่ายมาก ✨</h1>
        <p className="text-muted-foreground">3 ขั้นตอน เริ่มถ่ายได้เลย</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="relative p-6 rounded-3xl bg-card border border-border animate-fade-in"
              style={{ animationDelay: `${idx * 0.12}s` }}
            >
              {/* Number badge */}
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-lg animate-pulse-soft">
                {idx + 1}
              </div>

              <div className="mb-5">{s.visual}</div>

              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="font-heading font-bold text-lg">{s.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => { click(); onContinue(); }}
          className="h-16 px-12 rounded-full font-semibold text-lg shadow-xl hover:scale-[1.03] transition-transform"
          style={{ background: "#D4A853", color: "#000" }}
        >
          โอเค พร้อมถ่ายแล้ว! →
        </button>
      </div>
    </main>
  );
}
