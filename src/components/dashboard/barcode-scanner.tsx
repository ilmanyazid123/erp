"use client";

// Reusable camera barcode/QR scanner modal — dual engine.
// 1) Native BarcodeDetector API (Android/Chrome/Edge — same on-device engine
//    family as Google Lens): fast, reliable, no wasm.
// 2) ZXing (@zxing/browser) fallback for Firefox / iOS Safari / older browsers.
// Supports EAN-13/EAN-8/UPC/Code128/Code39/QR and more, decoded fully on-device.
// Continuous mode: every detected code fires onDetected(code) after a short
// cooldown, so users can scan several products in a row. Includes manual entry
// fallback, retry, camera switching (front/back) and torch (flashlight) support.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CameraOff,
  Lightbulb,
  RefreshCw,
  ScanLine,
  SwitchCamera,
  X,
} from "lucide-react";
import { ghostBtnCls, inputCls, primaryBtnCls } from "@/components/dashboard/ui";

export type ScanStatus = { ok: boolean; text: string } | null;

type StopFn = () => void;

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = {
  detect: (src: HTMLVideoElement) => Promise<DetectedBarcode[]>;
};
type BarcodeDetectorCtor = new () => BarcodeDetectorLike;

const UNSUPPORTED = "UNSUPPORTED_BROWSER";

function friendlyCameraError(err: unknown): string {
  const e = err as { name?: string; message?: string };
  const name = e?.name ?? "";
  const msg = e?.message ?? "";
  if (msg === UNSUPPORTED)
    return "Browser ini tidak mengizinkan akses kamera. Buka situs ini langsung di Chrome (Android) atau Safari (iPhone) — bukan lewat WebView aplikasi lain — atau gunakan input manual di bawah.";
  if (
    name === "NotAllowedError" ||
    name === "SecurityError" ||
    /not allowed|permission|denied/i.test(msg)
  )
    return "Akses kamera ditolak. Klik ikon gembok di address bar, izinkan Kamera, lalu tekan Coba lagi. Atau gunakan input manual di bawah.";
  if (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError" ||
    /not found|no camera/i.test(msg)
  )
    return "Kamera tidak ditemukan di perangkat ini. Gunakan input manual di bawah.";
  if (
    name === "NotReadableError" ||
    name === "TrackStartError" ||
    /readable|in use|start error/i.test(msg)
  )
    return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi kamera/video call, lalu tekan Coba lagi.";
  if (name === "OverconstrainedError")
    return "Kamera yang diminta tidak tersedia. Tekan Ganti kamera atau Coba lagi.";
  return "Kamera gagal dinyalakan. Tekan Coba lagi, atau gunakan input manual di bawah.";
}

// Errors where retrying via ZXing is pointless (same getUserMedia will fail).
function isHardCameraError(err: unknown): boolean {
  const name = (err as { name?: string })?.name ?? "";
  return [
    "NotAllowedError",
    "SecurityError",
    "NotFoundError",
    "DevicesNotFoundError",
    "NotReadableError",
    "TrackStartError",
  ].includes(name);
}

export function BarcodeScanner({
  open,
  onClose,
  onDetected,
  title = "Scan Barcode / QR",
  hint = "Arahkan barcode produk ke dalam kotak. Saat browser bertanya, pilih Izinkan kamera. Scan berkelanjutan — produk langsung ditambahkan.",
  status,
  manualPlaceholder = "Ketik kode barcode manual...",
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  title?: string;
  hint?: string;
  status?: ScanStatus;
  manualPlaceholder?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stopRef = useRef<StopFn | null>(null);
  const runIdRef = useRef(0);
  const lastRef = useRef<{ code: string; ts: number }>({ code: "", ts: 0 });
  const onDetectedRef = useRef(onDetected);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [starting, setStarting] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [hasMultiCam, setHasMultiCam] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  const beep = useCallback(() => {
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      setTimeout(() => void ctx.close(), 250);
    } catch {
      /* audio is best-effort */
    }
  }, []);

  const handleDetected = useCallback(
    (code: string) => {
      const now = Date.now();
      // Cooldown: ignore the same code twice within 1.5s (sticky scan).
      if (code === lastRef.current.code && now - lastRef.current.ts < 1500)
        return;
      lastRef.current = { code, ts: now };
      beep();
      onDetectedRef.current(code);
    },
    [beep],
  );

  const stopCamera = useCallback(() => {
    runIdRef.current += 1; // invalidate any in-flight start
    try {
      stopRef.current?.();
    } catch {
      /* already stopped */
    }
    stopRef.current = null;
    setHasTorch(false);
    setTorchOn(false);
  }, []);

  const refreshMultiCam = useCallback(async () => {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      setHasMultiCam(
        devs.filter((d) => d.kind === "videoinput").length > 1,
      );
    } catch {
      /* ignore */
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    const runId = runIdRef.current;
    const isStale = () => runId !== runIdRef.current;
    const killStream = (s: MediaStream | null | undefined) =>
      s?.getTracks().forEach((t) => t.stop());

    setCameraError(null);
    setStarting(true);

    // ---- Engine 2: ZXing fallback (Firefox / iOS Safari / others) ----
    const startZxing = async () => {
      if (isStale()) return;
      setStarting(true);
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const video = videoRef.current;
        if (!video) return;

        const onResult = (result: { getText: () => string } | null) => {
          if (result) handleDetected(result.getText().trim());
        };

        let controls: { stop: () => void };
        try {
          controls = await reader.decodeFromConstraints(
            { video: { facingMode: facing } },
            video,
            onResult,
          );
        } catch {
          // Requested camera unavailable — fall back to the default one.
          controls = await reader.decodeFromVideoDevice(
            undefined,
            video,
            onResult,
          );
        }
        if (isStale()) {
          try {
            controls.stop();
          } catch {
            /* ignore */
          }
          return;
        }
        stopRef.current = () => {
          try {
            controls.stop();
          } catch {
            /* ignore */
          }
          if (videoRef.current) videoRef.current.srcObject = null;
        };
        void refreshMultiCam();
      } catch (err) {
        if (!isStale()) setCameraError(friendlyCameraError(err));
      } finally {
        if (!isStale()) setStarting(false);
      }
    };

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error(UNSUPPORTED);

      let nativeOk = false;

      // ---- Engine 1: native BarcodeDetector (Android/Chrome) ----
      const Ctor = (
        window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }
      ).BarcodeDetector;
      if (Ctor) {
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facing,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          if (isStale()) {
            killStream(stream);
            return;
          }
          const video = videoRef.current;
          if (!video) {
            killStream(stream);
            return;
          }
          video.srcObject = stream;
          try {
            await video.play();
          } catch {
            /* autoplay policies — muted+playsInline usually allowed */
          }

          const track = stream.getVideoTracks()[0];
          const caps = (
            track as MediaStreamTrack & {
              getCapabilities?: () => { torch?: boolean };
            }
          ).getCapabilities?.();
          if (caps?.torch) setHasTorch(true);

          const detector = new Ctor();
          let stopped = false;
          let timer: ReturnType<typeof setTimeout> | undefined;
          let busy = false;
          let fails = 0;

          const cleanupLocal = () => {
            stopped = true;
            if (timer) clearTimeout(timer);
            killStream(stream);
            if (videoRef.current) videoRef.current.srcObject = null;
            setHasTorch(false);
            setTorchOn(false);
          };

          const loop = async () => {
            if (stopped) return;
            if (!busy && video.readyState >= 2) {
              busy = true;
              try {
                const found = await detector.detect(video);
                fails = 0;
                if (found?.length)
                  handleDetected((found[0].rawValue || "").trim());
              } catch {
                fails += 1;
                busy = false;
                if (fails > 20) {
                  // Native detection keeps failing on this browser —
                  // tear down and fall back to the ZXing engine.
                  cleanupLocal();
                  void startZxing();
                  return;
                }
                timer = setTimeout(() => void loop(), 400);
                return;
              }
              busy = false;
            }
            if (!stopped) timer = setTimeout(() => void loop(), 250);
          };

          void loop();
          if (isStale()) {
            cleanupLocal();
            return;
          }
          stopRef.current = cleanupLocal;
          nativeOk = true;
          void refreshMultiCam();
        } catch (err) {
          // Native path failed — clean partial state and fall back to ZXing,
          // except for hard errors (permission/device) where ZXing cannot
          // succeed either and would trigger a second permission prompt.
          killStream(stream);
          if (videoRef.current) videoRef.current.srcObject = null;
          setHasTorch(false);
          setTorchOn(false);
          if (isHardCameraError(err)) throw err;
        }
      }

      if (!nativeOk && !isStale()) await startZxing();
    } catch (err) {
      if (!isStale()) setCameraError(friendlyCameraError(err));
    } finally {
      if (!isStale()) setStarting(false);
    }
  }, [facing, handleDetected, stopCamera, refreshMultiCam]);

  // Start/stop the camera when the modal opens/closes (or camera is switched).
  useEffect(() => {
    if (!open) return;
    lastRef.current = { code: "", ts: 0 };
    void startCamera();
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  // Safety net: if the camera never starts within 12s, surface an error
  // instead of leaving the user stuck on "Menyalakan kamera...".
  useEffect(() => {
    if (!open || !starting) return;
    const t = setTimeout(() => {
      setCameraError(
        (prev) =>
          prev ??
          "Kamera lama merespons. Tekan Coba lagi, atau gunakan input manual di bawah.",
      );
      setStarting(false);
      stopCamera();
    }, 12_000);
    return () => clearTimeout(t);
  }, [open, starting, stopCamera]);

  const toggleTorch = async () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks?.()[0];
    if (!track) return;
    try {
      const next = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: next }],
      } as unknown as MediaTrackConstraints);
      setTorchOn(next);
    } catch {
      setHasTorch(false);
    }
  };

  if (!open) return null;

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manual.trim();
    if (!code) return;
    setManual("");
    onDetected(code);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4.5 w-4.5 text-primary" />
            <h3 className="text-sm font-semibold">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup scanner"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative aspect-[4/3] bg-black">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
            autoPlay
          />
          {/* Viewfinder frame */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-44 w-64 rounded-xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              <span className="absolute -left-1 -top-1 h-5 w-5 rounded-tl-md border-l-4 border-t-4 border-[color:var(--teal)]" />
              <span className="absolute -right-1 -top-1 h-5 w-5 rounded-tr-md border-r-4 border-t-4 border-[color:var(--teal)]" />
              <span className="absolute -bottom-1 -left-1 h-5 w-5 rounded-bl-md border-b-4 border-l-4 border-[color:var(--teal)]" />
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-br-md border-b-4 border-r-4 border-[color:var(--teal)]" />
            </div>
          </div>
          {starting && !cameraError ? (
            <p className="absolute inset-x-0 bottom-3 text-center text-xs text-white/80">
              Menyalakan kamera... izinkan akses jika browser bertanya.
            </p>
          ) : null}
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <CameraOff className="h-7 w-7 text-white/70" />
              <p className="text-xs leading-relaxed text-white/80">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => void startCamera()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Coba lagi
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 p-4">
          <p className="text-xs text-foreground/50">{hint}</p>

          {status ? (
            <p
              role="status"
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                status.ok
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {status.text}
            </p>
          ) : null}

          {hasMultiCam || hasTorch ? (
            <div className="flex flex-wrap gap-2">
              {hasMultiCam ? (
                <button
                  type="button"
                  onClick={() =>
                    setFacing((f) => (f === "environment" ? "user" : "environment"))
                  }
                  className={`${ghostBtnCls} inline-flex items-center gap-1.5`}
                >
                  <SwitchCamera className="h-3.5 w-3.5" /> Ganti kamera
                </button>
              ) : null}
              {hasTorch ? (
                <button
                  type="button"
                  onClick={() => void toggleTorch()}
                  className={`${ghostBtnCls} inline-flex items-center gap-1.5`}
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  {torchOn ? "Lampu nyala" : "Lampu mati"}
                </button>
              ) : null}
            </div>
          ) : null}

          <form
            className="flex items-center gap-2"
            onSubmit={submitManual}
          >
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              className={`${inputCls} flex-1`}
              placeholder={manualPlaceholder}
              aria-label="Input barcode manual"
              inputMode="numeric"
            />
            <button type="submit" className={primaryBtnCls}>
              Cari
            </button>
          </form>

          <button type="button" onClick={onClose} className={ghostBtnCls}>
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
