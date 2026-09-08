"use client";

// Footer — 3-column grid: brand, address, philosophy tagline.
import { Mail, MapPin } from "lucide-react";
import { useLang } from "@/components/providers";
import { FaizWordmark } from "@/components/faiz-logo";

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="bg-background border-t border-foreground/10 mt-auto">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Brand column */}
          <div>
            <FaizWordmark variant="light" label={t.footer.brandLabel} />
          </div>

          {/* Address column */}
          <address className="not-italic text-sm text-foreground/70 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-foreground/60" />
              <span>{t.footer.address}</span>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-foreground/60" />
              <a
                href={`mailto:${t.footer.email}`}
                className="transition-colors hover:text-primary hover:underline"
              >
                {t.footer.email}
              </a>
            </div>
          </address>

          {/* Tagline column */}
          <div className="sm:col-span-2 lg:col-span-1 lg:text-right text-sm text-foreground/60 italic">
            {t.footer.philosophy}
          </div>
        </div>
      </div>
    </footer>
  );
}
