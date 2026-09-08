"use client";

// Workflow section — 5 numbered step cards on page background.
import { useLang } from "@/components/providers";

export function WorkflowSection() {
  const { t } = useLang();

  return (
    <section id="workflow" className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <header className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-medium text-foreground">
            {t.workflow.title}
          </h2>
          <p className="mt-3 text-foreground/70 leading-relaxed">
            {t.workflow.subtitle}
          </p>
        </header>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {t.workflow.steps.map((step, i) => (
            <article
              key={step}
              className="relative rounded-lg border border-foreground/10 bg-card p-5 text-center shadow-sm lift-on-hover hover:shadow-md"
            >
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                {i + 1}
              </div>
              <div className="mt-3 text-sm font-semibold text-foreground">
                {step}
              </div>
              {/* Connector arrow on lg */}
              {i < t.workflow.steps.length - 1 ? (
                <span
                  aria-hidden
                  className="hidden lg:block absolute top-1/2 -right-2 -translate-y-1/2 text-foreground/30"
                >
                  →
                </span>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
