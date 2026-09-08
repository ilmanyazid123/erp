"use client";

// Hero section — blue band with noise overlay, white text, dashboard mockup.
import { ArrowRight, LayoutGrid, Boxes, ShieldCheck, Sparkles } from "lucide-react";
import { useLang, useAuthModal } from "@/components/providers";
import { DashboardMock } from "@/components/dashboard-mockups";

export function HeroSection() {
  const { t } = useLang();
  const { open } = useAuthModal();

  const microItems = [
    {
      label: t.hero.microLabel1,
      desc: t.hero.microDesc1,
      icon: Boxes,
    },
    {
      label: t.hero.microLabel2,
      desc: t.hero.microDesc2,
      icon: LayoutGrid,
    },
    {
      label: t.hero.microLabel3,
      desc: t.hero.microDesc3,
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="home" className="bg-primary bg-noise overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left column */}
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {t.hero.badge}
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-tight">
              {t.hero.title}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/80 leading-relaxed">
              {t.hero.subtitle}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => open("register")}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-5 text-sm font-medium text-primary shadow-sm transition-all hover:bg-white/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                {t.hero.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#screenshots"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                <LayoutGrid className="h-4 w-4" />
                {t.hero.ctaSecondary}
              </a>
            </div>

            {/* Micro-labels */}
            <dl className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {microItems.map(({ label, desc, icon: Icon }) => (
                <div key={label}>
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-white/60">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </div>
                  <dd className="mt-1 text-xs text-white/75">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right column — dashboard mockup */}
          <div className="lg:col-span-7">
            <div className="relative">
              <div className="absolute -inset-2 bg-white/10 rounded-xl blur-xl" aria-hidden />
              <div className="relative rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur shadow-2xl">
                <div className="overflow-hidden rounded-lg bg-background">
                  <div className="text-[10px] text-foreground/50 px-3 py-1.5 border-b border-foreground/10 bg-foreground/[0.02]">
                    {t.hero.dashboardAlt}
                  </div>
                  <DashboardMock />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
