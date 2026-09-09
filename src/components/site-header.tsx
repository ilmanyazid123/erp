"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, LogIn, LogOut, Menu, X, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLang, useAuthModal, signOut } from "@/components/providers";
import { FaizWordmark } from "@/components/faiz-logo";

export function SiteHeader() {
  const { t, lang, toggleLang } = useLang();
  const { open } = useAuthModal();
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: t.nav.features, href: "#features" },
    { label: t.nav.documentation, href: "#documentation" },
    { label: t.nav.pricing, href: "#pricing" },
    { label: t.nav.faq, href: "#faq" },
  ];

  const isAuthed = status === "authenticated" && !!session?.user;
  // @ts-expect-error - augmented field on session.user
  const businessName: string | undefined = session?.user?.businessName;

  return (
    <header
      className={`sticky top-0 z-40 bg-primary/90 backdrop-blur transition-shadow ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-5 sm:px-8">
        <a
          href="#home"
          className="flex items-center"
          aria-label="Beranda Managemen Tokoku"
        >
          <FaizWordmark variant="color" />
        </a>

        {/* Desktop nav */}
        <nav className="ml-8 hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/75 transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={toggleLang}
            className="text-sm font-medium text-white/80 transition-colors hover:text-white"
            aria-label="Toggle language"
          >
            {t.nav.languageLabel}
          </button>

          {isAuthed ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur">
                <User className="h-4 w-4" />
                <span className="max-w-[160px] truncate">
                  {businessName ?? session?.user?.name ?? session?.user?.email}
                </span>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => open("login")}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              <LogIn className="h-4 w-4" />
              {t.nav.login}
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((s) => !s)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white lg:hidden"
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile horizontal-scroll nav (visible below lg, matches original) */}
      <nav className="flex w-full items-center gap-5 overflow-x-auto border-t border-white/10 px-5 py-2 no-scrollbar lg:hidden">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className="shrink-0 text-sm font-medium text-white/75 transition-colors hover:text-white"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
