"use client";

// Reusable camera barcode/QR scanner modal — parallel dual engine.
// The camera stream is opened once, then BOTH engines listen to it:
//   1) Native BarcodeDetector API (Android/Chrome/Edge — the on-device engine
//      family behind Google Lens): fast, high-quality, no wasm.
//   2) ZXing (@zxing/browser) decoding the same <video> continuously — a
//      second opinion that rescues devices where BarcodeDetector exists but
//      silently returns nothing (broken ML backend / WebView builds), and the
//      ONLY engine on iOS Safari & Firefox.
// Whichever engine reads first wins; a shared cooldown prevents duplicates.
// Supports EAN-13/EAN-8/UPC/Code128/Code39/QR and more, decoded fully
// on-device. Continuous mode: every detected code fires onDetected(code),
// so users can scan several products in a row. Includes manual entry
// fallback, retry, camera switching (front/back) and torch support.

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
type BarcodeDetectorOptions = { formats?: string[] };
type BarcodeDetectorCtor = new (
  opts?: BarcodeDetectorOptions,
) => BarcodeDetectorLike;

const UNSUPPORTED = "UNSUPPORTED_BROWSER";

// Formats commonly needed in retail (UMKM) workflows. If a platform rejects
// the list we retry with the no-arg constructor (all supported formats).
const NATIVE_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "code_93",
  "codabar",
  "itf",
  "qr_code",
  "data_matrix",
  "pdf417",
  "aztec",
];

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

// Errors where retrying with a different engine is pointless (the same
// getUserMedia will fail again and another prompt would just confuse).
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
  hint = "Arahkan barcode produk ke dalam kotak. Setiap scan menambah 1 — angkat produk sejenak lalu arahkan lagi untuk menambah qty.",
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
  // Presence-aware dedupe: a code must LEAVE the camera view for GONE_MS
  // before it can be accepted again — otherwise a barcode resting in front
  // of the camera would keep incrementing the quantity forever.
  const seenRef = useRef<{ code: string; ts: number }>({ code: "", ts: 0 });
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
      // Same code still (or just) in view → part of the same scan event.
      if (code === seenRef.current.code && now - seenRef.current.ts < 1000) {
        seenRef.current.ts = now;
        return;
      }
      // New code, or the previous one left the view — accept it.
      seenRef.current = { code, ts: now };
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
      setHasMultiCam(devs.filter((d) => d.kind === "videoinput").length > 1);
    } catch {
      /* ignore */
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    const runId = runIdRef.current;
    const isStale = () => runId !== runIdRef.current;

    setCameraError(null);
    setStarting(true);

    let stream: MediaStream | null = null;
    // Composite stop for every engine started during this run.
    const engineStops: StopFn[] = [];
    const stopAll = () => {
      for (const stop of engineStops) {
        try {
          stop();
        } catch {
          /* ignore */
        }
      }
      engineStops.length = 0;
      stream?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setHasTorch(false);
      setTorchOn(false);
    };

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error(UNSUPPORTED);

      // ---- Open the camera once, shared by both engines ----
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      if (isStale()) {
        stopAll();
        return;
      }
      const video = videoRef.current;
      if (!video) {
        stopAll();
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

      let anyEngine = false;

      // ---- Engine A: native BarcodeDetector (Android/Chrome) ----
      const Ctor = (
        window as unknown as {
          BarcodeDetector?: new (opts?: BarcodeDetectorOptions) => BarcodeDetectorLike;
        }
      ).BarcodeDetector;
      if (Ctor) {
        let detector: BarcodeDetectorLike;
        try {
          detector = new Ctor({ formats: NATIVE_FORMATS });
        } catch {
          detector = new Ctor();
        }

        let stopped = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let busy = false;
        let fails = 0;

        engineStops.push(() => {
          stopped = true;
          if (timer) clearTimeout(timer);
        });

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
              if (fails > 20) {
                // This platform's native detector keeps throwing — retire it
                // and let the ZXing engine (already running) carry the scan.
                stopped = true;
                return;
              }
            }
            busy = false;
          }
          if (!stopped)
            timer = setTimeout(() => void loop(), fails > 0 ? 400 : 250);
        };

        void loop();
        anyEngine = true;
      }

      // ---- Engine B: ZXing decoding the SAME stream continuously ----
      // Runs always: sole engine on iOS/Firefox, second opinion elsewhere.
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader(undefined, {
          delayBetweenScanAttempts: 500,
          delayBetweenScanSuccess: 1200,
        });
        const controls = await reader.decodeFromStream(stream, video, (result) => {
          if (result) handleDetected(result.getText().trim());
        });
        if (isStale()) {
          try {
            controls.stop();
          } catch {
            /* ignore */
          }
          return;
        }
        engineStops.push(() => {
          try {
            controls.stop();
          } catch {
            /* ignore */
          }
        });
        anyEngine = true;
      } catch (zxErr) {
        // ZXing failed to attach. If the native engine is alive we can keep
        // scanning with it; otherwise there is no engine at all → error.
        if (!anyEngine) throw zxErr;
      }

      if (isStale()) {
        stopAll();
        return;
      }
      stopRef.current = stopAll;
      void refreshMultiCam();
    } catch (err) {
      stopAll();
      if (!isStale()) setCameraError(friendlyCameraError(err));
    } finally {
      if (!isStale()) setStarting(false);
    }
  }, [facing, handleDetected, stopCamera, refreshMultiCam]);

  // Start/stop the camera when the modal opens/closes (or camera is switched).
  useEffect(() => {
    if (!open) return;
    seenRef.current = { code: "", ts: 0 };
    void startCamera();
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  // Safety net: if no engine is producing a camera feed within 12s, surface
  // an error instead of leaving the user stuck on "Menyalakan kamera...".
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
