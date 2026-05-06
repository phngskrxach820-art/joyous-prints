import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { framesForFormat, type Frame, type FormatId } from "@/lib/frames";
import { FORMAT_META } from "@/components/FormatCard";
import {
  FULL_DESIGNS,
  STRIP_DESIGNS,
  DESIGN_META,
  type DesignId,
} from "@/components/PhotoboothOverlay";

type Props = {
  format: FormatId;
  onBack: () => void;
  onPick: (frame: Frame | null) => void;
};

export function ThemePicker({ format, onBack, onPick }: Props) {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [selected, setSelected] = useState<string>("__placeholder__");

  const designIds: readonly DesignId[] =
    format === "A" ? STRIP_DESIGNS : FULL_DESIGNS;
  const [designId, setDesignId] = useState<DesignId>(designIds[0]);

  useEffect(() => {
    const f = framesForFormat(format);
    setFrames(f);
    setSelected(f[0]?.id ?? "__placeholder__");
    setDesignId(designIds[0]);
  }, [format]);

  const meta = FORMAT_META.find((m) => m.id === format);

  function confirm() {
    const f = frames.find((x) => x.id === selected) ?? null;
    onPick(f);
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-5xl mx-auto animate-fade-in flex flex-col">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> เปลี่ยนขนาด
      </button>
      <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">
        เลือกธีมกรอบ 🎨
      </h1>
      <p className="text-sm text-muted-foreground mb-3">{meta?.title}</p>

      {/* Design selector (FULL/STRIP) */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4">
        {designIds.map((id) => {
          const m = DESIGN_META[id];
          const active = designId === id;
          return (
            <button
              key={id}
              onClick={() => setDesignId(id)}
              className={`flex-shrink-0 px-4 h-11 rounded-full border-2 text-sm font-semibold transition-all ${
                active
                  ? "border-primary bg-primary text-primary-foreground scale-[1.03]"
                  : "border-border bg-card hover:border-primary/60"
              }`}
            >
              {m.emoji} {m.label}
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
        {frames.length === 0 && (
          <button
            onClick={() => setSelected("__placeholder__")}
            className={`group relative rounded-3xl border-2 overflow-hidden bg-card transition-all ${
              selected === "__placeholder__" ? "border-primary scale-[1.02]" : "border-border"
            }`}
          >
            <div className="aspect-[2/3] bg-muted/40 flex items-center justify-center text-6xl">
              🎨
            </div>
            <div className="p-3 text-center">
              <p className="font-semibold">ธีมมาตรฐาน</p>
              <p className="text-xs text-muted-foreground mt-1">เร็วๆ นี้ จะมีให้เลือกเพิ่ม</p>
            </div>
          </button>
        )}
        {frames.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelected(f.id)}
            className={`group relative rounded-3xl border-2 overflow-hidden bg-card transition-all ${
              selected === f.id ? "border-primary scale-[1.02]" : "border-border hover:border-primary/60"
            }`}
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

      <div className="mt-6">
        <button
          onClick={confirm}
          className="w-full h-14 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:scale-[1.01] transition"
        >
          เลือกธีมนี้เลย →
        </button>
      </div>
    </main>
  );
}
