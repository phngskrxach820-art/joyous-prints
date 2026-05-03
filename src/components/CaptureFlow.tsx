import { useEffect, useRef, useState } from "react";
import { Camera as CamIcon, RefreshCw, ArrowLeft } from "lucide-react";
import { tick, shutter } from "@/lib/audio";

type Props = {
  onComplete: (photos: Blob[]) => void;
  totalShots?: number;
  onBack?: () => void;
};

export function CaptureFlow({ onComplete, totalShots = 4, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<"init" | "ready" | "preview" | "countdown" | "flash" | "review" | "done" | "error">("init");
  const [shotIndex, setShotIndex] = useState(0); // 0..3
  const [count, setCount] = useState(3);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [errMsg, setErrMsg] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  // Init camera
  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        // Request a permissive default first to get permission, then enumerate
        const initial = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          initial.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = initial;
        if (videoRef.current) videoRef.current.srcObject = initial;
        const all = await navigator.mediaDevices.enumerateDevices();
        const cams = all.filter((d) => d.kind === "videoinput");
        setDevices(cams);
        const used = initial.getVideoTracks()[0]?.getSettings().deviceId ?? cams[0]?.deviceId ?? "";
        setSelectedDeviceId(used);
        setPhase("ready");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "ไม่สามารถเข้าถึงกล้อง";
        setErrMsg(msg);
        setPhase("error");
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Switch camera
  async function switchCamera(deviceId: string) {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setSelectedDeviceId(deviceId);
    } catch (e) {
      console.error(e);
    }
  }

  // No auto countdown — user taps the button.

  function beginCountdown() {
    setPhase("countdown");
    setCount(3);
  }

  // Countdown ticker
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) {
      capture();
      return;
    }
    tick();
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, count]);

  async function capture() {
    shutter();
    const video = videoRef.current;
    if (!video) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    // Crop to portrait 3:4 from center of landscape video
    const targetRatio = 3 / 4;
    let cropW = vh * targetRatio;
    let cropH = vh;
    if (cropW > vw) {
      cropW = vw;
      cropH = vw / targetRatio;
    }
    const sx = (vw - cropW) / 2;
    const sy = (vh - cropH) / 2;
    const outW = 900;
    const outH = 1200;
    const c = document.createElement("canvas");
    c.width = outW;
    c.height = outH;
    const ctx = c.getContext("2d")!;
    // mirror selfie
    ctx.translate(outW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, outW, outH);
    const blob: Blob = await new Promise((res, rej) =>
      c.toBlob((b) => (b ? res(b) : rej()), "image/jpeg", 0.92),
    );
    const url = URL.createObjectURL(blob);
    const newBlobs = [...blobs, blob];
    const newThumbs = [...thumbs, url];
    setBlobs(newBlobs);
    setThumbs(newThumbs);
    setPhase("flash");
    setTimeout(() => {
      // Show thumbnail review for 1.5s
      setPhase("review");
      setTimeout(() => {
        if (newBlobs.length >= totalShots) {
          setPhase("done");
          setTimeout(() => onComplete(newBlobs), 2000);
        } else {
          setShotIndex((i) => i + 1);
          setPhase("ready");
        }
      }, 1500);
    }, 180);
  }

  if (phase === "error") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8 text-center">
        <div>
          <CamIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-3">เปิดกล้องไม่ได้</h2>
          <p className="text-muted-foreground mb-6 max-w-md">{errMsg}</p>
          <p className="text-sm text-muted-foreground">
            กรุณาอนุญาตให้เว็บใช้กล้อง แล้วรีเฟรชหน้านี้
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center">
      {/* Back button */}
      {onBack && phase === "ready" && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-20 inline-flex items-center gap-1 px-3 py-2 rounded-full bg-card/80 backdrop-blur border border-border text-xs font-semibold hover:bg-card"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> ถ่ายใหม่
        </button>
      )}

      {/* Progress */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-card/80 backdrop-blur border border-border text-sm font-semibold">
        รูปที่ {Math.min(shotIndex + 1, totalShots)}/{totalShots}
      </div>

      {/* Camera selector */}
      {devices.length > 1 && phase === "ready" && (
        <div className="absolute top-4 right-4 z-20">
          <select
            value={selectedDeviceId}
            onChange={(e) => switchCamera(e.target.value)}
            className="text-xs px-3 py-2 rounded-full bg-card/80 backdrop-blur border border-border"
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video stage */}
      <div className="relative w-full max-w-4xl mx-auto aspect-video rounded-3xl overflow-hidden bg-black mt-16 shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }} // mirror like a selfie cam
        />

        {/* Portrait crop guides — dim outside 3:4 area */}
        <div className="absolute inset-y-0 left-0 bg-black/60 pointer-events-none" style={{ width: "28.9%" }} />
        <div className="absolute inset-y-0 right-0 bg-black/60 pointer-events-none" style={{ width: "28.9%" }} />
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-2 border-white/70 rounded-xl pointer-events-none" style={{ width: "42.2%" }} />

        {/* Countdown */}
        {phase === "countdown" && count > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              key={count}
              className="text-[14rem] font-bold text-white animate-pop drop-shadow-2xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {count}
            </div>
          </div>
        )}

        {/* Flash */}
        {phase === "flash" && (
          <div className="absolute inset-0 bg-white animate-flash pointer-events-none" />
        )}

        {/* Review thumbnail */}
        {phase === "review" && thumbs.length > 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <img
              src={thumbs[thumbs.length - 1]}
              className="max-h-[80%] rounded-2xl shadow-2xl animate-fade-in"
              alt="just captured"
            />
          </div>
        )}

        {/* Done — 2x2 grid */}
        {phase === "done" && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-8 backdrop-blur-sm animate-fade-in">
            <div className="grid grid-cols-2 gap-3 max-w-md mb-6">
              {thumbs.map((src, i) => (
                <img key={i} src={src} className="rounded-xl shadow-lg w-full aspect-video object-cover" alt={`shot ${i + 1}`} />
              ))}
            </div>
            <p className="text-2xl font-bold text-white">ได้ครบ {totalShots} รูปแล้ว! 🎉</p>
          </div>
        )}
      </div>

      {/* Manual trigger */}
      {phase === "ready" && (
        <button
          onClick={beginCountdown}
          className="mt-6 inline-flex items-center justify-center px-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-xl hover:scale-[1.03] transition-transform"
          style={{ minHeight: 64 }}
        >
          📸 เริ่มถ่ายเลย!
        </button>
      )}

      {/* Thumbnail strip below */}
      <div className="mt-6 flex gap-3">
        {Array.from({ length: totalShots }, (_, i) => i).map((i) => (
          <div
            key={i}
            className={`w-16 h-12 rounded-lg border-2 overflow-hidden ${
              thumbs[i] ? "border-primary" : "border-border bg-muted"
            }`}
          >
            {thumbs[i] && <img src={thumbs[i]} className="w-full h-full object-cover" alt="" />}
          </div>
        ))}
      </div>
    </div>
  );
}
