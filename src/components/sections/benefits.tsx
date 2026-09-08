"use client";

// Benefits section — 4 benefit cards on page background.
import {
  RefreshCcw,
  Search,
  Eye,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/components/providers";

export function BenefitsSection() {
  const { t } = useLang();
  const icons: LucideIcon[] = [RefreshCcw, Search, Eye, TrendingUp];

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <h2 className="text-3xl font-medium text-foreground">
              {t.benefits.title}
            </h2>
            <p className="mt-3 text-foreground/70 leading-relaxed">
              {t.benefits.subtitle}
            </p>
          </div>
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {t.benefits.items.map((item, i) => {
                const Icon = icons[i];
                return (
                  <article
                    key={item.title}
                    className="rounded-lg border border-foreground/10 bg-card p-5 shadow-sm lift-on-hover hover:shadow-md hover:border-foreground/15"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--teal)]/10 text-[color:var(--teal)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 text-base font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
                      {item.desc}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
