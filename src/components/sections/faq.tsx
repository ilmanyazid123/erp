"use client";

// FAQ section — 3 static Q&A blocks on page background.
import { useLang } from "@/components/providers";

export function FaqSection() {
  const { t } = useLang();
  return (
    <section id="faq" className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <header className="max-w-3xl">
          <h2 className="text-3xl font-medium text-foreground">
            {t.faq.title}
          </h2>
        </header>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {t.faq.items.map((item) => (
            <article
              key={item.q}
              className="rounded-lg border border-foreground/10 bg-card p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-foreground">
                {item.q}
              </h3>
              <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
                {item.a}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
