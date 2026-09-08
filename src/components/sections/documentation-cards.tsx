"use client";

// Documentation cards section — 4 cards + a CTA button to "open documentation".
import { Rocket, Boxes, Store, HelpCircle, ArrowRight, type LucideIcon } from "lucide-react";
import { useLang } from "@/components/providers";

export function DocumentationCardsSection() {
  const { t } = useLang();
  const icons: LucideIcon[] = [Rocket, Boxes, Store, HelpCircle];

  return (
    <section id="documentation" className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <header className="max-w-3xl">
          <h2 className="text-3xl font-medium text-foreground">
            {t.docs.title}
          </h2>
          <p className="mt-3 text-foreground/70 leading-relaxed">
            {t.docs.subtitle}
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {t.docs.cards.map((card, i) => {
            const Icon = icons[i];
            return (
              <a
                key={card.title}
                href="#documentation"
                className="group rounded-lg border border-foreground/10 bg-card p-5 shadow-sm lift-on-hover hover:shadow-md hover:border-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-base font-semibold text-foreground">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
                  {card.desc}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                  {t.docs.cta.replace("Buka ", "").replace("Open ", "")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </a>
            );
          })}
        </div>

        <div className="mt-8">
          <a
            href="#documentation"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-foreground/15 bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t.docs.cta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
