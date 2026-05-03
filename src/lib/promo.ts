// Daily promo-slot counter — resets at local midnight.
const KEY = "photobooth_promo_v1";

export const PROMO_LIMIT = Number(import.meta.env.VITE_DAILY_PROMO_LIMIT ?? 5);
export const NORMAL_PRICE = Number(import.meta.env.VITE_NORMAL_PRICE ?? 69);
export const PROMO_PRICE = Number(import.meta.env.VITE_PROMO_PRICE ?? 49);
export const REPRINT_PRICE = Number(import.meta.env.VITE_REPRINT_PRICE ?? 30);

type State = { date: string; promoUsed: number };

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getPromoState(): State {
  if (typeof window === "undefined") return { date: today(), promoUsed: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { date: today(), promoUsed: 0 };
    const s = JSON.parse(raw) as State;
    if (s.date !== today()) return { date: today(), promoUsed: 0 };
    return s;
  } catch {
    return { date: today(), promoUsed: 0 };
  }
}

export function promoRemaining(): number {
  return Math.max(0, PROMO_LIMIT - getPromoState().promoUsed);
}

export function consumePromo() {
  const s = getPromoState();
  const next: State = { date: today(), promoUsed: Math.min(PROMO_LIMIT, s.promoUsed + 1) };
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function resetPromo() {
  localStorage.setItem(KEY, JSON.stringify({ date: today(), promoUsed: 0 }));
}
