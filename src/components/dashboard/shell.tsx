"use client";

// Dashboard shell: sidebar + topbar + scrollable content area.
// Sidebar menu mirrors the FaizERP modules promoted on the landing page:
// Dashboard, Inventory, Purchasing, Sales, Finance, Master, Chat, Settings.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";

export type ShellUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  businessName?: string | null;
};

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const MENU_MAIN: MenuItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package },
  { href: "/dashboard/purchasing", label: "Purchasing", icon: ShoppingCart },
  { href: "/dashboard/sales", label: "Sales", icon: Store },
  { href: "/dashboard/finance", label: "Finance", icon: Wallet },
];

const MENU_MANAGEMENT: MenuItem[] = [
  { href: "/dashboard/master", label: "Master Data", icon: Users },
  { href: "/dashboard/chat", label: "Chat Tim", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];

function SidebarNav({ user, onNavigate }: { user: ShellUser; onNavigate?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-foreground/10 px-5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
          F
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">FaizERP</span>
          <span className="max-w-[140px] truncate text-[11px] leading-tight text-foreground/60">
            {user.businessName ?? "Workspace"}
          </span>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu utama">
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
          Menu Utama
        </p>
        <ul className="flex flex-col gap-1">
          {MENU_MAIN.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive(href)
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <p className="mb-2 mt-6 px-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
          Manajemen
        </p>
        <ul className="flex flex-col gap-1">
          {MENU_MANAGEMENT.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive(href)
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User card */}
      <div className="shrink-0 border-t border-foreground/10 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">
              {user.name ?? "Pengguna"}
            </p>
            <p className="truncate text-[11px] text-foreground/60">
              {user.role ?? "MEMBER"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
    setUserMenu(false);
  }, [pathname]);

  const currentLabel =
    [...MENU_MAIN, ...MENU_MANAGEMENT].find((m) =>
      m.href === "/dashboard"
        ? pathname === m.href
        : pathname.startsWith(m.href),
    )?.label ?? "Dashboard";

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-foreground/10 bg-card lg:block">
        <SidebarNav user={user} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-foreground/10 bg-card shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/5"
              aria-label="Tutup menu"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarNav
              user={user}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-foreground/10 bg-card px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70 hover:bg-foreground/5 lg:hidden"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h1 className="text-base font-semibold sm:text-lg">{currentLabel}</h1>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground sm:inline-flex"
            >
              <ExternalLink className="h-4 w-4" />
              Situs Publik
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenu((s) => !s)}
                aria-expanded={userMenu}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-lg border border-foreground/10 bg-background px-2.5 py-1.5 text-sm transition-colors hover:bg-foreground/5"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-[140px] truncate sm:inline">
                  {user.name ?? user.email}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-foreground/50" />
              </button>

              {userMenu ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-foreground/10 bg-card shadow-lg"
                >
                  <div className="border-b border-foreground/10 px-4 py-3">
                    <p className="truncate text-sm font-medium">
                      {user.name ?? "Pengguna"}
                    </p>
                    <p className="truncate text-xs text-foreground/60">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-foreground/5"
                  >
                    <Settings className="h-4 w-4" />
                    Pengaturan
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[color:var(--coral)] transition-colors hover:bg-foreground/5"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
