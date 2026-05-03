import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { framesForFormat, type Frame, type FormatId } from "@/lib/frames";
import { FORMAT_META } from "@/components/FormatCard";

type Props = {
  format: FormatId;
  onBack: () => void;
  onPick: (frame: Frame) => void;
};

export function ThemePicker({ format, onBack, onPick }: Props) {
  const [frames, setFrames] = useState<Frame[]>([]);

  useEffect(() => {
    const f = framesForFormat(format);
    setFrames(f);
    if (f.length === 1) onPick(f[0]);
  }, [format]);

  const meta = FORMAT_META.find((m) => m.id === format);

  if (frames.length <= 1) return null;

  return (
    <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto animate-fade-in">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> เปลี่ยนขนาด
      </button>
      <h1 className="text-3xl md:text-4xl font-heading font-bold mb-8">
        เลือกธีมกรอบสำหรับ {meta?.title} 🎨
      </h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {frames.map((f) => (
          <button
            key={f.id}
            onClick={() => onPick(f)}
            className="group relative rounded-3xl border-2 border-border hover:border-primary overflow-hidden bg-card transition-all hover:scale-[1.02]"
          >
            <div className="aspect-[2/3] bg-muted/40 flex items-center justify-center">
              <img src={f.url} alt={f.filename} className="w-full h-full object-contain" />
            </div>
            <div className="p-3 text-sm font-semibold text-center">
              {f.filename.replace(/^frame_(strip|full)_/, "").replace(/\.png$/, "")}
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
