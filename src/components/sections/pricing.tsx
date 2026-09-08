"use client";

// Pricing section — 4 plan cards on white background. The Team plan is
// highlighted with a primary border + ring and a "Rekomendasi" badge.
import { Check, ArrowRight, Star } from "lucide-react";
import { useLang, useAuthModal } from "@/components/providers";

export function PricingSection() {
  const { t } = useLang();
  const { open } = useAuthModal();

  return (
    <section id="pricing" className="bg-card border-y border-foreground/10">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <header className="max-w-3xl">
          <h2 className="text-3xl font-medium text-foreground">
            {t.pricing.title}
          </h2>
          <p className="mt-3 text-foreground/70 leading-relaxed">
            {t.pricing.subtitle}
          </p>
          <p className="mt-3 text-sm text-foreground/60">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/[0.03] px-3 py-1">
              <Check className="h-3.5 w-3.5 text-[color:var(--teal)]" />
              {t.pricing.trialNote}
            </span>
          </p>
        </header>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {t.pricing.plans.map((plan) => {
            const recommended = "recommended" in plan && plan.recommended === true;
            return (
              <article
                key={plan.name}
                className={`relative rounded-lg border bg-background p-5 shadow-sm lift-on-hover hover:shadow-md ${
                  recommended
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-foreground/10 hover:border-foreground/15"
                }`}
              >
                {recommended ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                    <Star className="h-3 w-3 fill-current" />
                    {t.pricing.recommended}
                  </span>
                ) : null}
                <h3 className="text-base font-semibold text-foreground">
                  {plan.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-sm text-foreground/60">
                    {t.pricing.perMonth}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/70">{plan.users}</p>
                <ul className="mt-4 space-y-1.5">
                  <li className="flex items-start gap-2 text-sm text-foreground/75">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--teal)]" />
                    {t.pricing.includesAll}
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => open("register")}
                  className={`mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    recommended
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-foreground/15 bg-background text-foreground hover:bg-foreground/[0.04]"
                  }`}
                >
                  {t.pricing.cta}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            );
          })}
        </div>

        <p className="mt-6 text-sm text-foreground/60">
          {t.pricing.billingNote}
        </p>
      </div>
    </section>
  );
}
