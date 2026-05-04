// Web Audio tick / shutter beep
let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return ctx;
}

export function beep(freq: number, duration = 0.08, gain = 0.15) {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(g).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

export const tick = () => beep(800, 0.06);
export const shutter = () => beep(1200, 0.12, 0.2);
export const click = () => beep(600, 0.05, 0.12);

// Cheerful "payment received" chime — ascending C-E-G-C arpeggio
export function paymentSuccess() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => setTimeout(() => beep(f, 0.18, 0.22), i * 110));
}

// Short pleasant chime — 440Hz → 880Hz over 0.3s
export function chime() {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  const t0 = ac.currentTime;
  osc.frequency.setValueAtTime(440, t0);
  osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.3);
  g.gain.setValueAtTime(0.22, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + 0.32);
}

