import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import PhotoboothOverlay, {
  FULL_DESIGNS,
  STRIP_DESIGNS,
  DESIGN_META,
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

export function ThemePicker({ onBack, onPick }: Props) {
  const [designId, setDesignId] = useState<DesignId>(STRIP_DESIGNS[0]);

  const layout: "A" | "B" = DESIGN_META[designId].format === "strip" ? "A" : "B";

  function renderCard(id: DesignId) {
    const meta = DESIGN_META[id];
    const active = designId === id;
    return (
      <button
        key={id}
        onClick={() => setDesignId(id)}
        className={`group relative rounded-3xl border-2 overflow-hidden bg-card transition-all ${
          active ? "border-primary scale-[1.02] shadow-lg" : "border-border hover:border-primary/60"
        }`}
      >
        <div className="w-full flex items-center justify-center p-3 bg-muted/30">
          <div className="w-full max-w-[180px]">
            <PhotoboothOverlay design={id} filter="none">
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${meta.bgColor}, ${meta.accentColor})`,
                }}
              />
            </PhotoboothOverlay>
          </div>
        </div>
        <div className="p-3 text-sm font-semibold text-center">
          {meta.emoji} {meta.labelThai}
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
        <ArrowLeft className="h-4 w-4" /> กลับ
      </button>
      <h1 className="text-2xl md:text-3xl font-heading font-bold mb-4">เลือกธีมกรอบ 🎨</h1>

      <section className="mb-6">
        <h2 className="text-lg font-heading font-bold mb-3">แบบแถบ 2x6 💑 (3 รูป)</h2>
        <div className="grid grid-cols-2 gap-3">
          {STRIP_DESIGNS.map((id) => renderCard(id))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-heading font-bold mb-3">เต็มแผ่น 4x6 🖼️ (4 รูป)</h2>
        <div className="grid grid-cols-2 gap-3">
          {FULL_DESIGNS.map((id) => renderCard(id))}
        </div>
      </section>

      <div className="mt-auto pt-4 sticky bottom-4">
        <button
          onClick={() => onPick({ layout, designId, filter: "none" })}
          className="w-full h-14 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:scale-[1.01] transition shadow-xl"
        >
          ไปต่อ →
        </button>
      </div>
    </main>
  );
}
