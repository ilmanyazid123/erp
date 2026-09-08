"use client";

// System Features section — 11 module cards with bullet points, white background.
import {
  Building2,
  Boxes,
  ShoppingCart,
  Store,
  Wallet,
  GitBranch,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Check,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/components/providers";

export function FeaturesSection() {
  const { t } = useLang();
  const icons: LucideIcon[] = [
    Building2,
    Boxes,
    ShoppingCart,
    Store,
    Wallet,
    GitBranch,
    BarChart3,
    MessageSquare,
    ShieldCheck,
    CreditCard,
    // 11 items
  ];
  // Make sure we have at least 11 icons.
  while (icons.length < t.features.items.length) {
    icons.push(Check);
  }

  return (
    <section id="features" className="bg-card border-y border-foreground/10">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <header className="max-w-3xl">
          <h2 className="text-3xl font-medium text-foreground">
            {t.features.title}
          </h2>
          <p className="mt-3 text-foreground/70 leading-relaxed">
            {t.features.subtitle}
          </p>
        </header>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {t.features.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <article
                key={item.title}
                className="rounded-lg border border-foreground/10 bg-background p-5 shadow-sm lift-on-hover hover:shadow-md hover:border-foreground/15"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                </div>
                <ul className="mt-4 space-y-2">
                  {item.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-sm text-foreground/75"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--teal)]" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
