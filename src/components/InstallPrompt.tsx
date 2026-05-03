import { useEffect, useState } from "react";

const KEY = "heng_install_prompt_dismissed_v1";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [iosModal, setIosModal] = useState(false);
  const [bip, setBip] = useState<BIP | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEY) === "1") return;
    // Skip in iframes / lovable preview
    let inIframe = false;
    try { inIframe = window.self !== window.top; } catch { inIframe = true; }
    if (inIframe) return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS
      window.navigator.standalone;
    if (standalone) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setBip(e as BIP);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    const t = setTimeout(() => setShow(true), 3000);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onBip);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(KEY, "1");
    setShow(false);
    setIosModal(false);
  }

  function install() {
    const ua = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    if (bip) {
      bip.prompt();
      bip.userChoice.finally(dismiss);
      return;
    }
    if (isIos) {
      setIosModal(true);
      return;
    }
    dismiss();
  }

  if (!show && !iosModal) return null;

  return (
    <>
      {show && !iosModal && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] rounded-2xl border border-border bg-card/95 backdrop-blur shadow-2xl p-4 flex items-center gap-3 animate-fade-in">
          <span className="text-2xl">📱</span>
          <p className="flex-1 text-sm">เพิ่มลงหน้าจอหลักเพื่อใช้งานได้เลย</p>
          <button onClick={install} className="px-4 h-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            เพิ่มเลย
          </button>
          <button onClick={dismiss} className="text-xs text-muted-foreground px-2">
            ภายหลัง
          </button>
        </div>
      )}
      {iosModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-3xl border border-border max-w-sm w-full p-6 text-center">
            <p className="text-2xl mb-3">📲</p>
            <p className="text-base mb-4">กด <b>Share</b> → แล้วกด <b>"เพิ่มไปยังหน้าจอโฮม"</b></p>
            <button onClick={dismiss} className="w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold">
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </>
  );
}
