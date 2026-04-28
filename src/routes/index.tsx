import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Instructions } from "@/components/Instructions";
import { Camera } from "lucide-react";
import { click } from "@/lib/audio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Photo Booth — พร้อมถ่ายรูปแล้วหรือยัง?" },
      { name: "description", content: "บูธถ่ายรูปอัตโนมัติ 4 ช็อตติดกัน เลือกแบบ จ่ายเลย รับรูปทันที" },
    ],
  }),
  component: Home,
});

function Home() {
  const [view, setView] = useState<"home" | "instructions">("home");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function start() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .insert({ price: 50 })
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-xl animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 mb-8">
          <Camera className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-body">
            Photo Booth
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight mb-8 leading-tight">
          พร้อมถ่ายรูป
          <br />
          แล้วหรือยัง? 📷
        </h1>

        <button
          onClick={() => { click(); setView("instructions"); }}
          disabled={loading}
          className="h-16 px-12 rounded-full bg-primary text-primary-foreground font-semibold text-lg shadow-xl hover:scale-[1.03] transition-transform disabled:opacity-60"
        >
          เริ่มเลย! →
        </button>
      </div>
    </main>
  );
}
