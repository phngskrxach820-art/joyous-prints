import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera } from "lucide-react";

export const Route = createFileRoute("/live")({
  component: LiveView,
});

function LiveView() {
  const [time, setTime] = useState("");
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString("th-TH"));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveDot((d) => (d + 1) % 3), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center text-center px-6" style={{ background: "#0D0D0D", color: "#FAFAFA" }}>
      {/* Animated gradient */}
      <div
        className="absolute inset-0 opacity-40 animate-gradient pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary), var(--color-secondary), var(--color-primary))",
        }}
      />

      {/* Bokeh */}
      {Array.from({ length: 9 }).map((_, i) => {
        const size = 40 + Math.random() * 80;
        return (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-drift pointer-events-none"
            style={{
              width: size,
              height: size,
              left: `${(i * 11) % 100}%`,
              top: `${(i * 23) % 100}%`,
              opacity: 0.15 + Math.random() * 0.15,
              filter: "blur(20px)",
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${15 + i * 2}s`,
            }}
          />
        );
      })}

      <div className="relative z-10 animate-fade-in">
        <Camera className="h-20 w-20 mx-auto mb-8 text-white animate-pulse-soft" strokeWidth={1.5} />
        <h1 className="font-heading font-bold leading-tight mb-3" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}>
          พร้อมถ่ายรูปแล้วหรือยัง? 📷
        </h1>
        <p className="text-xl opacity-70 mb-8">มาถ่ายรูปด้วยกันเลย</p>
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all"
              style={{
                background: "var(--color-primary)",
                opacity: activeDot === i ? 1 : 0.3,
                transform: activeDot === i ? "scale(1.4)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm opacity-50 z-10 font-mono">
        {time}
      </div>
    </main>
  );
}
