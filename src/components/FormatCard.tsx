import { useEffect, useRef, useState } from "react";
import type { Frame, FormatId } from "@/lib/frames";
import { framesForFormat } from "@/lib/frames";
import { NORMAL_PRICE, PROMO_PRICE, REPRINT_PRICE } from "@/lib/promo";

export type FormatMeta = {
  id: FormatId;
  title: string;
  shotsLabel: string;
  emoji: string;
};

export const FORMAT_META: FormatMeta[] = [
  { id: "A", title: "แบ่งให้เพื่อน 💑", shotsLabel: "ถ่าย 3 รูป ได้ 2 แถบ", emoji: "💑" },
  { id: "B", title: "เต็มแผ่น 4x6 🖼️", shotsLabel: "ถ่าย 4 รูป เต็มแผ่น", emoji: "🖼️" },
];

export function FormatCard({
  meta,
  selected,
  onSelect,
}: {
  meta: FormatMeta;
  selected?: boolean;
  onSelect: (id: FormatId) => void;
}) {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [idx, setIdx] = useState(0);
  const [hovering, setHovering] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFrames(framesForFormat(meta.id));
  }, [meta.id]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (hovering && frames.length > 1) {
      intervalRef.current = setInterval(() => {
        setIdx((i) => (i + 1) % frames.length);
      }, 1200);
    } else {
      setIdx(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [hovering, frames.length]);

  const current = frames[idx]?.url;

  return (
    <button
      onClick={() => onSelect(meta.id)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onTouchStart={() => {
        longPressRef.current = setTimeout(() => setHovering(true), 350);
      }}
      onTouchEnd={() => {
        if (longPressRef.current) clearTimeout(longPressRef.current);
        setHovering(false);
      }}
      className={`group relative rounded-3xl border-2 overflow-hidden transition-all text-left bg-card ${
        selected ? "border-primary scale-[1.02]" : "border-border hover:border-primary/70 hover:scale-[1.02]"
      }`}
    >
      {/* Top 65%: frame preview */}
      <div className="relative aspect-[2/3] bg-muted/40 flex items-center justify-center overflow-hidden">
        {frames.length === 0 && <span className="text-6xl opacity-50">{meta.emoji}</span>}
        {frames.map((f, i) => (
          <img
            key={f.id}
            src={f.url}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain transition-opacity duration-[400ms]"
            style={{ opacity: i === idx && current ? 1 : 0 }}
          />
        ))}
        {hovering && frames.length > 1 && (
          <span className="absolute top-2 right-2 text-[11px] bg-background/80 text-foreground px-2 py-1 rounded-full animate-fade-in">
            เลื่อนดูกรอบ →
          </span>
        )}
        {frames.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {frames.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-4 bg-primary" : "w-1.5 bg-foreground/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom 35%: info */}
      <div className="p-4">
        <h3 className="font-heading font-bold text-lg mb-1">{meta.title}</h3>
        <p className="text-xs text-muted-foreground mb-2">{meta.shotsLabel}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground line-through">ปกติ {NORMAL_PRICE}.-</span>
          <span className="text-base font-bold text-primary">โปร {PROMO_PRICE}.-</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">+ ปริ้นท์ซ้ำ {REPRINT_PRICE}.-</p>
      </div>
    </button>
  );
}
