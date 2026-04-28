import { Camera, CreditCard, Printer, ArrowRight, X } from "lucide-react";

const steps = [
  {
    icon: Camera,
    emoji: "📷",
    title: "เริ่มถ่ายรูป",
    body: "เข้าไปยืนในกรอบ แล้วรอ countdown 3-2-1 ระบบจะถ่ายให้อัตโนมัติ รูปจะปรากฏบนหน้าจอทันที",
  },
  {
    icon: CreditCard,
    emoji: "💳",
    title: "สแกน QR จ่ายเงิน",
    body: "เลือก format ที่ต้องการ กรอกข้อมูลสั้นๆ แล้วสแกน QR PromptPay เพื่อชำระเงิน รอยืนยันประมาณ 5-10 วินาที",
  },
  {
    icon: Printer,
    emoji: "🖨️",
    title: "ดาวน์โหลดหรือปริ้นท์",
    body: "สแกน QR เพื่อบันทึกรูปลงมือถือ หรือกดปุ่ม 'สั่งปริ้นท์' เพื่อรับรูปจากเครื่องปริ้นท์ได้เลย",
  },
];

export function InstructionModal({
  open,
  onClose,
  onContinue,
}: {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm px-4 py-8 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-6xl">
        <button
          onClick={onClose}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <X className="h-4 w-4" /> ย้อนกลับ
        </button>

        <div className="text-center mb-12">
          <p className="text-gold uppercase tracking-[0.3em] text-xs mb-3">How it works</p>
          <h1 className="text-4xl md:text-5xl font-bold">วิธีใช้งาน 3 ขั้นตอน</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-4 items-stretch">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative flex">
                <div className="relative w-full rounded-2xl border border-white/10 bg-card/60 p-8 backdrop-blur-md hover:border-primary/40 transition-all hover:-translate-y-1 duration-300">
                  <div
                    className="absolute -top-5 -left-2 h-12 w-12 rounded-full bg-gradient-gold flex items-center justify-center font-bold text-primary-foreground shadow-gold animate-pulse-soft"
                    style={{ animationDelay: `${i * 0.4}s` }}
                  >
                    {i + 1}
                  </div>
                  <div className="text-5xl mb-6 mt-2">{step.emoji}</div>
                  <Icon className="h-6 w-6 text-gold mb-4" strokeWidth={1.5} />
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 z-10 -translate-y-1/2">
                    <ArrowRight className="h-5 w-5 text-gold/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={onContinue}
            className="group inline-flex items-center justify-center gap-3 h-14 px-10 rounded-full bg-gradient-gold text-primary-foreground font-semibold text-base shadow-gold hover:scale-[1.02] transition-transform w-full md:w-auto"
          >
            เข้าใจแล้ว เริ่มเลย
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
