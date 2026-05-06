import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import PhotoboothOverlay, {
  FULL_DESIGNS,
  STRIP_DESIGNS,
  DESIGN_META,
  FILTER_ORDER,
  FILTER_LABELS,
  type DesignId,
  type FilterKey,
} from "@/components/PhotoboothOverlay";

export type ThemePickResult = {
  layout: "A" | "B";
  designId: DesignId;
  filter: FilterKey;
};

type Props = {
  onBack: () => void;
  onPick: (result: ThemePickResult) => void;
};

const PLACEHOLDER_GRADIENTS: Record<DesignId, string> = {
  "strip-classic": "linear-gradient(135deg,#fde68a,#f59e0b)",
  "strip-y2k-pink": "linear-gradient(135deg,#fbcfe8,#ec4899)",
  "strip-pastel": "linear-gradient(135deg,#dbeafe,#a78bfa)",
  "full-classic": "linear-gradient(135deg,#fef3c7,#fb923c)",
  "full-y2k-pink": "linear-gradient(135deg,#fce7f3,#f472b6)",
  "full-pastel": "linear-gradient(135deg,#e0e7ff,#c4b5fd)",
};

export function ThemePicker({ onBack, onPick }: Props) {
  const [designId, setDesignId] = useState<DesignId>(STRIP_DESIGNS[0]);
  const [filter, setFilter] = useState<FilterKey>("none");

  const layout: "A" | "B" = (STRIP_DESIGNS as readonly string[]).includes(designId) ? "A" : "B";

  function renderCard(id: DesignId, isStrip: boolean) {
    const m = DESIGN_META[id];
    const active = designId === id;
    return (
      <button
        key={id}
        onClick={() => setDesignId(id)}
        className={`group relative rounded-3xl border-2 overflow-hidden bg-card transition-all ${
          active ? "border-primary scale-[1.02] shadow-lg" : "border-border hover:border-primary/60"
        }`}
      >
        <div className={isStrip ? "aspect-[2/3]" : "aspect-[3/2]"}>
          <PhotoboothOverlay design={id} filter={filter}>
            <div
              className="w-full h-full"
              style={{ background: PLACEHOLDER_GRADIENTS[id] }}
            />
          </PhotoboothOverlay>
        </div>
        <div className="p-3 text-sm font-semibold text-center">
          {m.emoji} {m.label}
        </div>
        {active && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
            <Check className="h-4 w-4" />
          </div>
        )}
      </button>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-5xl mx-auto animate-fade-in flex flex-col">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> เปลี่ยนใจ
      </button>
      <h1 className="text-2xl md:text-3xl font-heading font-bold mb-4">เลือกธีมกรอบ 🎨</h1>

      <section className="mb-6">
        <h2 className="text-lg font-heading font-bold mb-3">แบบแถบ 2x6 💑</h2>
        <div className="grid grid-cols-2 gap-3">
          {STRIP_DESIGNS.map((id) => renderCard(id, true))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-heading font-bold mb-3">เต็มแผ่น 4x6 🖼️</h2>
        <div className="grid grid-cols-2 gap-3">
          {FULL_DESIGNS.map((id) => renderCard(id, false))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-heading font-bold mb-3">เลือกโทนสีที่ชอบ 🎨</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {FILTER_ORDER.map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 px-4 h-11 rounded-full border-2 text-sm font-semibold transition-all ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                {FILTER_LABELS[key]}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-auto pt-4">
        <button
          onClick={() => onPick({ layout, designId, filter })}
          className="w-full h-14 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:scale-[1.01] transition"
        >
          เลือกแล้ว ไปถ่ายเลย! →
        </button>
      </div>
    </main>
  );
}
