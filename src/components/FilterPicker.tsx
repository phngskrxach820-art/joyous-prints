import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { FILTERS, FILTER_LABELS, type FilterKey } from "@/lib/filters";
import { renderLayout, type LayoutId } from "@/lib/composer";

type Props = {
  photos: string[];
  initialFilter?: FilterKey;
  layout: LayoutId;
  onNext: (filter: FilterKey) => void;
  onBack?: () => void;
};

const FILTER_ORDER: FilterKey[] = ["none", "softSkin", "vintage", "blackWhite"];

function useComposedPreview(layout: LayoutId, photos: string[], filter: FilterKey) {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let prev = "";
    setLoading(true);
    renderLayout(layout, photos, FILTERS[filter])
      .then((blob) => {
        if (cancelled) return;
        const u = URL.createObjectURL(blob);
        setUrl((old) => { prev = old; return u; });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
      if (prev) URL.revokeObjectURL(prev);
    };
  }, [layout, photos, filter]);
  return { url, loading };
}

function ThumbPreview({ layout, photos, filter }: { layout: LayoutId; photos: string[]; filter: FilterKey }) {
  const { url } = useComposedPreview(layout, photos, filter);
  return (
    <div className="bg-white rounded-md overflow-hidden" style={{ aspectRatio: "100/148", width: 80 }}>
      {url && <img src={url} alt="" className="w-full h-full object-contain" />}
    </div>
  );
}

export function FilterPicker({ photos, initialFilter = "none", layout, onNext, onBack }: Props) {
  const [selected, setSelected] = useState<FilterKey>(initialFilter);
  const { url, loading } = useComposedPreview(layout, photos, selected);

  return (
    <main className="min-h-screen px-4 py-6 max-w-3xl mx-auto animate-fade-in flex flex-col">
      <div className="flex items-center justify-between mb-4">
        {onBack ? (
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← กลับ</button>
        ) : <span />}
        <button
          onClick={() => onNext(selected)}
          className="px-6 h-11 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg hover:scale-[1.03] transition"
        >
          Next →
        </button>
      </div>

      <div className="mx-auto bg-white rounded-xl shadow-2xl overflow-hidden mb-4 relative" style={{ aspectRatio: "100/148", maxWidth: 280, width: "100%" }}>
        {url && <img src={url} alt="preview" className="w-full h-full object-contain" />}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <h2 className="text-xl font-heading font-bold text-center mb-1">เลือกโทนที่ชอบ</h2>
      <p className="text-sm text-muted-foreground text-center mb-4">Choose an effect</p>

      <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x justify-center">
        {FILTER_ORDER.map((key) => {
          const active = selected === key;
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`flex-shrink-0 snap-start rounded-2xl overflow-hidden bg-card transition-all p-2 ${
                active ? "border-[3px] border-primary scale-105 shadow-lg" : "border-2 border-border hover:border-primary/50"
              }`}
            >
              <div className="relative">
                <ThumbPreview layout={layout} photos={photos} filter={key} />
                {active && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div className="pt-1 text-[11px] font-semibold text-center">{FILTER_LABELS[key]}</div>
            </button>
          );
        })}
      </div>
    </main>
  );
}
