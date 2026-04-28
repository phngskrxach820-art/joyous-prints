import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera } from "lucide-react";

export const Route = createFileRoute("/live")({
  component: LivePage,
});

function LivePage() {
  const [latest, setLatest] = useState<{ photo_url: string | null; first_name: string | null } | null>(
    null
  );
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("sessions")
        .select("photo_url, first_name")
        .not("photo_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setLatest(data);
    };
    load();
    const channel = supabase
      .channel("live-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Demo countdown trigger
  useEffect(() => {
    const interval = setInterval(() => {
      let n = 3;
      setCountdown(n);
      const t = setInterval(() => {
        n -= 1;
        if (n <= 0) {
          clearInterval(t);
          setCountdown(null);
        } else {
          setCountdown(n);
        }
      }, 1000);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,oklch(0.76_0.13_80/0.15),transparent_60%)]" />

      {countdown !== null && (
        <div className="absolute z-30 text-[20rem] font-bold bg-gradient-gold bg-clip-text text-transparent animate-pulse-soft">
          {countdown}
        </div>
      )}

      <div className="relative z-10 text-center max-w-3xl px-8">
        {latest?.photo_url ? (
          <>
            <img
              src={latest.photo_url}
              alt="Latest"
              className="max-h-[70vh] mx-auto rounded-3xl shadow-2xl animate-fade-in glow-gold"
            />
            {latest.first_name && (
              <p className="mt-6 text-2xl text-white/90 animate-fade-in">
                ✨ {latest.first_name}
              </p>
            )}
          </>
        ) : (
          <div className="text-white/60">
            <Camera className="h-24 w-24 mx-auto mb-6 text-gold animate-pulse-soft" strokeWidth={1} />
            <p className="text-3xl font-light tracking-wide">Ready when you are</p>
            <p className="mt-3 text-sm uppercase tracking-[0.3em] text-gold">Photo Booth Live</p>
          </div>
        )}
      </div>
    </main>
  );
}
