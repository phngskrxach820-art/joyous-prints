import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Sparkles } from "lucide-react";
import { InstructionModal } from "@/components/InstructionModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Photo Booth — Studio Experience" },
      {
        name: "description",
        content: "บูธถ่ายรูปอัตโนมัติพร้อมพิมพ์และดาวน์โหลด เริ่มต้นเพียง 50 บาท",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const startSession = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .insert({ price: 50 })
      .select("id")
      .single();
    setLoading(false);
    if (error || !data) {
      toast.error("ไม่สามารถเริ่ม session ได้");
      return;
    }
    navigate({ to: "/session/$id", params: { id: data.id } });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-2xl animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Studio Photo Booth
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          ถ่ายรูป
          <span className="block bg-gradient-gold bg-clip-text text-transparent">
            สวย พิมพ์ทันที
          </span>
        </h1>

        <p className="text-lg text-muted-foreground mb-12 max-w-md mx-auto leading-relaxed">
          บูธถ่ายรูปอัตโนมัติ พร้อมเฟรมและฟิลเตอร์สวยๆ ดาวน์โหลดหรือพิมพ์ได้เลย
        </p>

        <button
          onClick={() => setShowInstructions(true)}
          className="group inline-flex items-center gap-3 h-16 px-12 rounded-full bg-gradient-gold text-primary-foreground font-semibold text-lg shadow-gold hover:scale-[1.03] transition-transform"
        >
          <Camera className="h-5 w-5" />
          Start Session
        </button>

        <p className="mt-6 text-xs text-muted-foreground">
          เริ่มต้น <span className="text-gold font-semibold">50.-</span> ต่อครั้ง
        </p>
      </div>

      <InstructionModal
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        onContinue={startSession}
      />

      {loading && (
        <div className="absolute bottom-8 text-sm text-muted-foreground">กำลังเตรียม...</div>
      )}
    </main>
  );
}
