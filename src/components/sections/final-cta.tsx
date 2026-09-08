"use client";

// Final CTA section — single H2 + paragraph + a "Buat Akun" button.
import { ArrowRight } from "lucide-react";
import { useLang, useAuthModal } from "@/components/providers";

export function FinalCtaSection() {
  const { t } = useLang();
  const { open } = useAuthModal();
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-medium text-foreground">
            {t.finalCta.title}
          </h2>
          <p className="mt-4 text-foreground/70 leading-relaxed">
            {t.finalCta.body}
          </p>
          <button
            type="button"
            onClick={() => open("register")}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t.finalCta.cta}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
