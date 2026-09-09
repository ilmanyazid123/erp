"use client";

// Reusable camera barcode/QR scanner modal (ZXing).
// Supports EAN-13/EAN-8/UPC/Code128/Code39/QR and more — the same codes
// Google Lens reads, decoded fully on-device in the browser.
// Continuous mode: every detected code fires onDetected(code) after a
// short cooldown, so users can scan several products in a row.
// Includes a manual-entry fallback for devices without a camera.

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraOff, ScanLine, X } from "lucide-react";
import { ghostBtnCls, inputCls, primaryBtnCls } from "@/components/dashboard/ui";

export type ScanStatus = { ok: boolean; text: string } | null;

type ScannerControls = { stop: () => void };

export function BarcodeScanner({
  open,
  onClose,
  onDetected,
  title = "Scan Barcode / QR",
  hint = "Arahkan barcode produk ke dalam kotak. Scan berkelanjutan — produk langsung ditambahkan.",
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
  const controlsRef = useRef<ScannerControls | null>(null);
  const lastRef = useRef<{ code: string; ts: number }>({ code: "", ts: 0 });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [starting, setStarting] = useState(false);

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

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCameraError(null);
    setStarting(true);

    (async () => {
      try {
        // Dynamic import keeps the ~100KB ZXing bundle out of the main chunk.
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader(false);
        if (cancelled || !videoRef.current) return;

        const handle = (code: string) => {
          const now = Date.now();
          // Cooldown: ignore the same code twice within 1.5s (sticky scan).
          if (code === lastRef.current.code && now - lastRef.current.ts < 1500)
            return;
          lastRef.current = { code, ts: now };
          beep();
          onDetected(code);
        };

        let controls: ScannerControls;
        // Prefer the rear camera on phones, fall back to any camera.
        try {
          controls = (await reader.decodeFromConstraints(
            { video: { facingMode: "environment" } },
            videoRef.current,
            (result) => {
              if (result) handle(result.getText().trim());
            },
          )) as unknown as ScannerControls;
        } catch {
          controls = (await reader.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (result) => {
              if (result) handle(result.getText().trim());
            },
          )) as unknown as ScannerControls;
        }
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof Error ? err.message : "";
        setCameraError(
          name.includes("NotAllowed") || name.includes("Permission")
            ? "Akses kamera ditolak. Izinkan kamera di pengaturan browser, atau gunakan input manual di bawah."
            : "Kamera tidak tersedia di perangkat ini. Gunakan input manual di bawah.",
        );
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      try {
        controlsRef.current?.stop();
      } catch {
        /* already stopped */
      }
      controlsRef.current = null;
    };
  }, [open, beep, onDetected]);

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
              Menyalakan kamera...
            </p>
          ) : null}
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
              <CameraOff className="h-7 w-7 text-white/70" />
              <p className="text-xs leading-relaxed text-white/80">
                {cameraError}
              </p>
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
