"use client";

import { useEffect, useState } from "react";
import { FaizLogo } from "@/components/faiz-logo";

// Page loader — full-screen overlay shown briefly on initial load.
export function PageLoader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 450);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      aria-hidden
      className={`page-loader ${hidden ? "is-hidden" : ""}`}
      style={{ pointerEvents: hidden ? "none" : "auto" }}
    >
      <div className="flex flex-col items-center gap-3">
        <FaizLogo className="h-12 w-12 animate-pulse" />
        <span className="text-xs text-foreground/50">FaizERP.id</span>
      </div>
    </div>
  );
}
