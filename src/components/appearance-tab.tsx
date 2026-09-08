"use client";

import { useState, useSyncExternalStore } from "react";
import { MoonStar, Settings, Sun, SunMoon, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useLang } from "@/components/providers";

// Detect "mounted" without triggering setState-in-effect lint warnings.
// Server snapshot = false, client snapshot = true. Subscription is a no-op
// because the value never changes after mount.
const emptySubscribe = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

export function AppearanceTab() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t } = useLang();
  const mounted = useSyncExternalStore(emptySubscribe, getClientMounted, getServerMounted);

  // The current effective theme (system → resolved).
  const effective = theme === "system" ? "system" : theme === "dark" ? "dark" : "light";

  const options: {
    key: "system" | "light" | "dark";
    label: string;
    icon: React.ReactNode;
  }[] = [
    { key: "system", label: t.appearance.system, icon: <SunMoon className="h-5 w-5" /> },
    { key: "light", label: t.appearance.light, icon: <Sun className="h-5 w-5" /> },
    { key: "dark", label: t.appearance.dark, icon: <MoonStar className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* Floating right-edge vertical tab */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.appearance.title}
        className="fixed inset-y-0 right-0 z-50 my-auto flex h-12 w-14 cursor-pointer items-center justify-center rounded-l-lg border border-r-0 border-foreground/15 bg-background text-foreground shadow-md transition-all hover:w-20"
        style={{ top: 0, bottom: 0, margin: "auto 0" }}
      >
        <Settings className="h-5 w-5" />
      </button>

      {/* Modal */}
      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${t.appearance.title} — ${t.appearance.subtitle}`}
            className="relative w-full max-w-md rounded-xl border border-foreground/10 bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-semibold">{t.appearance.title}</h3>
            <p className="mt-1 text-sm text-foreground/70">
              {t.appearance.subtitle}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {options.map((opt) => {
                const active = mounted && effective === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setTheme(opt.key);
                      setOpen(false);
                    }}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:scale-[1.03] ${
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-foreground/10 bg-background text-foreground/80 hover:border-foreground/20"
                    }`}
                    aria-pressed={active}
                  >
                    <span className="flex h-10 w-10 items-center justify-center">
                      {opt.icon}
                    </span>
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
