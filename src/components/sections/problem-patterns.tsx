"use client";

// Problem Patterns section — 4 problem cards on page background.
import {
  Files,
  MessageCircleQuestion,
  Boxes,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/components/providers";

export function ProblemPatternsSection() {
  const { t } = useLang();
  const icons: LucideIcon[] = [Files, MessageCircleQuestion, Boxes, Clock];

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <header className="max-w-3xl">
          <h2 className="text-3xl font-medium text-foreground">
            {t.problems.title}
          </h2>
          <p className="mt-3 text-foreground/70 leading-relaxed">
            {t.problems.subtitle}
          </p>
        </header>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {t.problems.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <article
                key={item.title}
                className="rounded-lg border border-foreground/10 bg-card p-5 shadow-sm lift-on-hover hover:shadow-md hover:border-foreground/15"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
    </section>
  );
}
