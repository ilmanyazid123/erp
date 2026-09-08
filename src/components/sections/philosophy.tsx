"use client";

// Philosophy CTA band — full-width blue band with white text.
import { useLang } from "@/components/providers";

export function PhilosophySection() {
  const { t } = useLang();
  return (
    <section className="bg-primary border-y border-primary/10 text-white">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-medium text-white">
            {t.philosophy.title}
          </h2>
          <p className="mt-4 text-white/85 leading-relaxed">
            {t.philosophy.body}
          </p>
        </div>
      </div>
    </section>
  );
}
