import { useState } from "react";
import { Check } from "lucide-react";
import { FILTERS, FILTER_LABELS, type FilterKey } from "@/components/PhotoboothOverlay";

type Props = {
  photos: string[];
  initialFilter?: FilterKey;
  layout?: "A" | "B";
  onNext: (filter: FilterKey) => void;
  onBack?: () => void;
};

const FILTER_ORDER: FilterKey[] = ["none", "softSkin", "vintage", "blackWhite"];

export function FilterPicker({ photos, initialFilter = "none", layout = "A", onNext, onBack }: Props) {
  const [selected, setSelected] = useState<FilterKey>(initialFilter);
  const hero = photos[0];
  const aspectRatio = layout === "A" ? "9 / 16" : "3 / 4";

  return (
    <main className="min-h-screen px-4 py-6 max-w-3xl mx-auto animate-fade-in flex flex-col">
      <div className="flex items-center justify-between mb-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← กลับ
          </button>
        ) : <span />}
        <button
          onClick={() => onNext(selected)}
          className="px-6 h-11 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg hover:scale-[1.03] transition"
        >
          Next →
        </button>
      </div>

      {hero && (
        <div
          className="rounded-3xl overflow-hidden bg-black shadow-2xl mb-4 mx-auto"
          style={{ aspectRatio, width: "100%", maxHeight: "55vh" }}
        >
          <img
            src={hero}
            alt="preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: FILTERS[selected],
            }}
          />
        </div>
      )}

      <h2 className="text-xl font-heading font-bold text-center mb-1">เลือกโทนที่ชอบ</h2>
      <p className="text-sm text-muted-foreground text-center mb-4">Choose an effect</p>

      <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x">
        {FILTER_ORDER.map((key) => {
          const active = selected === key;
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`flex-shrink-0 snap-start rounded-2xl overflow-hidden bg-card transition-all ${
                active
                  ? "border-[3px] border-primary scale-105 shadow-lg"
                  : "border-2 border-border hover:border-primary/50"
              }`}
            >
              <div className="bg-black relative" style={{ aspectRatio, height: 90 }}>
                {hero && (
                  <img
                    src={hero}
                    alt={key}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: FILTERS[key],
                    }}
                  />
                )}
                {active && (
                  <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
              <div className="p-2 text-xs font-semibold text-center">
                {FILTER_LABELS[key]}
              </div>
            </button>
          );
        })}
      </div>

      {photos.length > 1 && (
        <div className="mt-6">
          <p className="text-xs text-muted-foreground mb-2">รูปทั้งหมด</p>
          <div className="grid grid-cols-4 gap-2">
            {photos.map((p, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden bg-black"
                style={{ aspectRatio }}
              >
                <img
                  src={p}
                  alt={`shot ${i + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: FILTERS[selected],
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
