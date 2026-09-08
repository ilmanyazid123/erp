"use client";

// Screenshots section — large dashboard mockup on the right + 5 thumbnail cards.
import {
  LayoutGrid,
  Monitor,
  MessageSquare,
  LogIn,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/components/providers";
import {
  DashboardMock,
  POSMock,
  ChatMock,
  LoginMock,
  RegisterMock,
} from "@/components/dashboard-mockups";

export function ScreenshotsSection() {
  const { t } = useLang();
  const cardIcons: LucideIcon[] = [
    LayoutGrid,
    Monitor,
    MessageSquare,
    LogIn,
    UserPlus,
  ];
  const cardMocks = [
    <DashboardMock key="dashboard" compact />,
    <POSMock key="pos" />,
    <ChatMock key="chat" />,
    <LoginMock key="login" />,
    <RegisterMock key="register" />,
  ];

  return (
    <section
      id="screenshots"
      className="bg-foreground/[0.03] border-y border-foreground/10"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        {/* Top row: title + large dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5">
            <h2 className="text-3xl font-medium text-foreground">
              {t.screenshots.title}
            </h2>
            <p className="mt-3 text-foreground/70 leading-relaxed">
              {t.screenshots.subtitle}
            </p>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-lg border border-foreground/10 bg-card p-3 shadow-xl">
              <DashboardMock />
            </div>
          </div>
        </div>

        {/* Bottom row: 5 thumbnail cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {t.screenshots.cards.map((card, i) => {
            const Icon = cardIcons[i];
            const Mock = cardMocks[i];
            return (
              <article
                key={card.title}
                className="rounded-lg border border-foreground/10 bg-card p-3 shadow-sm lift-on-hover hover:shadow-md"
              >
                <div className="overflow-hidden rounded-md border border-foreground/10 bg-foreground/[0.02]">
                  <div className="aspect-[4/3]">{Mock}</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">
                    {card.title}
                  </h3>
                </div>
                <p className="mt-1.5 text-xs text-foreground/65 leading-relaxed">
                  {card.desc}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
