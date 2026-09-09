"use client";

// CSS-based mockups of the Managemen Tokoku UI, used in the hero and screenshots
// sections of the homepage. Pure HTML/CSS — no images required.

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronDown,
  CircleUser,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Package,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Real data hook — fetches dashboard stats when authenticated.        */
/* ------------------------------------------------------------------ */
type RealStats = {
  stats: Array<{
    label: string;
    value: string;
    delta: string;
    up: boolean;
    tone: "primary" | "teal" | "coral";
    icon: string;
  }>;
  salesSeries: Array<{ date: string; value: number }>;
  lowStock: Array<{ name: string; quantity: number }>;
};

const TONE_BY_NAME: Record<string, "primary" | "teal" | "coral"> = {
  primary: "primary",
  teal: "teal",
  coral: "coral",
};
const ICON_BY_NAME: Record<string, LucideIcon> = {
  "trending-up": TrendingUp,
  wallet: Wallet,
  receipt: Receipt,
  package: Package,
};

function useDashboardStats() {
  const { status } = useSession();
  const [data, setData] = useState<RealStats | null>(null);

  useEffect(() => {
    let active = true;
    if (status !== "authenticated") return;
    fetch("/api/dashboard/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && Array.isArray(d.stats)) setData(d);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [status]);

  return data;
}

function useActivities() {
  const { status } = useSession();
  const [data, setData] = useState<
    | Array<{ label: string; timeAgo: string; tone: "primary" | "teal" | "coral" }>
    | null
  >(null);

  useEffect(() => {
    let active = true;
    if (status !== "authenticated") return;
    fetch("/api/activities")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && Array.isArray(d.activities) && d.activities.length > 0) {
          setData(
            d.activities.slice(0, 5).map(
              (a: { label: string; timeAgo: string; tone: "primary" | "teal" | "coral" }) => ({
                label: a.label,
                timeAgo: a.timeAgo,
                tone: a.tone,
              }),
            ),
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [status]);

  return data;
}

/* ------------------------------------------------------------------ */
/* Window chrome shared by all mockups                                 */
/* ------------------------------------------------------------------ */
function WindowChrome({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-foreground/10 bg-foreground/[0.03] px-4 py-2.5">
      <div className="flex gap-1.5">
        <span className="h-3 w-3 rounded-full bg-red-400/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
        <span className="h-3 w-3 rounded-full bg-green-400/80" />
      </div>
      <span className="ml-2 text-xs font-medium text-foreground/60 truncate">
        {title}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar for dashboard                                               */
/* ------------------------------------------------------------------ */
function Sidebar() {
  const items = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Package, label: "Inventory" },
    { icon: ShoppingCart, label: "Purchasing" },
    { icon: Store, label: "Sales" },
    { icon: Wallet, label: "Finance" },
    { icon: Users, label: "Master" },
    { icon: MessageSquare, label: "Chat" },
    { icon: Settings, label: "Settings" },
  ];
  return (
    <aside className="hidden w-48 shrink-0 flex-col border-r border-foreground/10 bg-foreground/[0.02] p-3 sm:flex">
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary text-white text-[10px] font-bold">
          F
        </span>
        <span className="text-xs font-semibold">Managemen Tokoku</span>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ icon: Icon, label, active }) => (
          <span
            key={label}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground/70"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </span>
        ))}
      </nav>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard mockup                                                    */
/* ------------------------------------------------------------------ */
export function DashboardMock({ compact = false }: { compact?: boolean }) {
  const realStats = useDashboardStats();
  const realActivities = useActivities();

  const stats = realStats
    ? realStats.stats.map((s) => ({
        label: s.label,
        value: s.value,
        delta: s.delta,
        up: s.up,
        icon: ICON_BY_NAME[s.icon] ?? TrendingUp,
        tone: TONE_BY_NAME[s.tone] ?? "primary",
      }))
    : [
        { label: "Sales", value: "Rp 42.3M", delta: "+12.4%", up: true, icon: TrendingUp, tone: "primary" as const },
        { label: "Cash", value: "Rp 18.7M", delta: "+3.1%", up: true, icon: Wallet, tone: "teal" as const },
        { label: "Approval", value: "5 request", delta: "−2", up: false, icon: Receipt, tone: "coral" as const },
        { label: "Low Stock", value: "12 items", delta: "+3", up: false, icon: Package, tone: "primary" as const },
      ];
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    teal: "bg-[color:var(--teal)]/10 text-[color:var(--teal)]",
    coral: "bg-[color:var(--coral)]/10 text-[color:var(--coral)]",
  };
  const activities = realActivities
    ? realActivities.map((a) => ({
        label: a.label,
        time: a.timeAgo, // already formatted like "5m", "1h"
        tone: a.tone,
      }))
    : [
        { label: "PO-2031 approved by Rina", time: "5m", tone: "primary" as const },
        { label: "Sales INV-1187 paid by Andi", time: "12m", tone: "teal" as const },
        { label: "Stock adjustment on Gudang A", time: "32m", tone: "coral" as const },
        { label: "Team chat: Restock request", time: "1h", tone: "primary" as const },
        { label: "Cash out: Expense operasional", time: "2h", tone: "teal" as const },
      ];

  return (
    <div className="mock-window flex flex-col w-full">
      <WindowChrome title="managementokoku.id/dashboard" />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-foreground/10 bg-background px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Dashboard</span>
              <ChevronDown className="h-4 w-4 text-foreground/40" />
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 rounded-md border border-foreground/10 bg-background px-2 py-1 text-xs text-foreground/50">
                <Search className="h-3 w-3" /> Search…
              </div>
              <Bell className="h-4 w-4 text-foreground/60" />
              <CircleUser className="h-6 w-6 text-foreground/60" />
            </div>
          </div>

          {/* Body */}
          <div className="space-y-3 p-4">
            {/* Stat cards */}
            <div className={`grid gap-3 ${compact ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-4"}`}>
              {stats.map(({ label, value, delta, up, icon: Icon, tone }) => (
                <div
                  key={label}
                  className="rounded-lg border border-foreground/10 bg-background p-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${toneClasses[tone]}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs ${
                        up ? "text-[color:var(--teal)]" : "text-[color:var(--coral)]"
                      }`}
                    >
                      {up ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {delta}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-semibold">{value}</div>
                  <div className="text-xs text-foreground/60">{label}</div>
                </div>
              ))}
            </div>

            {/* Chart + activity */}
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-lg border border-foreground/10 bg-background p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Sales vs Cash Flow</span>
                  </div>
                  <span className="text-xs text-foreground/50">30 hari</span>
                </div>
                <MiniChart />
              </div>
              <div className="rounded-lg border border-foreground/10 bg-background p-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Aktivitas</span>
                </div>
                <ul className="mt-2 space-y-2">
                  {activities.map((a, i) => {
                    const timeLabel = realActivities ? a.time : `${a.time} ago`;
                    return (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            a.tone === "primary"
                              ? "bg-primary"
                              : a.tone === "teal"
                                ? "bg-[color:var(--teal)]"
                                : "bg-[color:var(--coral)]"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="text-foreground/80">{a.label}</div>
                          <div className="text-foreground/40">{timeLabel}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mini line/bar chart                                                 */
/* ------------------------------------------------------------------ */
function MiniChart() {
  // Pre-baked path so the chart renders deterministically without any chart library.
  return (
    <div className="mt-3 h-28 w-full">
      <svg viewBox="0 0 320 110" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Sales */}
        <path
          d="M0,80 L40,68 L80,72 L120,55 L160,60 L200,40 L240,48 L280,30 L320,38 L320,110 L0,110 Z"
          fill="url(#g1)"
        />
        <path
          d="M0,80 L40,68 L80,72 L120,55 L160,60 L200,40 L240,48 L280,30 L320,38"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
        />
        {/* Cash */}
        <path
          d="M0,90 L40,85 L80,82 L120,78 L160,75 L200,68 L240,70 L280,62 L320,60 L320,110 L0,110 Z"
          fill="url(#g2)"
        />
        <path
          d="M0,90 L40,85 L80,82 L120,78 L160,75 L200,68 L240,70 L280,62 L320,60"
          fill="none"
          stroke="#0d9488"
          strokeWidth="2"
        />
        {/* Bars */}
        {Array.from({ length: 12 }).map((_, i) => (
          <rect
            key={i}
            x={i * 26 + 6}
            y={92 - (i % 3) * 4}
            width="6"
            height={(i % 3) * 4 + 6}
            fill="#1e293b"
            opacity="0.12"
          />
        ))}
      </svg>
      <div className="mt-1 flex items-center gap-4 text-[10px] text-foreground/50">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-primary" /> Sales
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-[color:var(--teal)]" /> Cash
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* POS Sale mockup                                                     */
/* ------------------------------------------------------------------ */
export function POSMock() {
  const products = [
    { name: "Kopi Susu 250ml", price: "Rp 18.000", stock: 24, color: "primary" as const },
    { name: "Teh Manis 350ml", price: "Rp 12.000", stock: 40, color: "teal" as const },
    { name: "Roti Coklat", price: "Rp 9.500", stock: 8, color: "coral" as const },
    { name: "Air Mineral 600ml", price: "Rp 5.000", stock: 60, color: "primary" as const },
    { name: "Snack Kentang", price: "Rp 15.000", stock: 15, color: "teal" as const },
  ];
  const cart = [
    { name: "Kopi Susu 250ml", qty: 2, price: "Rp 36.000" },
    { name: "Roti Coklat", qty: 3, price: "Rp 28.500" },
  ];
  return (
    <div className="mock-window flex flex-col w-full">
      <WindowChrome title="managementokoku.id/pos/sale" />
      <div className="grid grid-cols-1 md:grid-cols-5">
        {/* Product list */}
        <div className="md:col-span-3 border-r border-foreground/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Kasir — Shift 1</span>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              Open
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {products.map((p) => {
              const ring =
                p.color === "primary"
                  ? "border-primary/20 bg-primary/5"
                  : p.color === "teal"
                    ? "border-[color:var(--teal)]/20 bg-[color:var(--teal)]/5"
                    : "border-[color:var(--coral)]/20 bg-[color:var(--coral)]/5";
              return (
                <div key={p.name} className={`rounded-lg border p-2 ${ring}`}>
                  <div className="text-xs font-medium text-foreground/80">
                    {p.name}
                  </div>
                  <div className="mt-1 text-sm font-semibold">{p.price}</div>
                  <div className="mt-0.5 text-[10px] text-foreground/50">
                    Stock: {p.stock}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Cart */}
        <div className="md:col-span-2 flex flex-col p-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Cart</span>
          </div>
          <div className="mt-2 space-y-1.5">
            {cart.map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between rounded-md border border-foreground/10 bg-background px-2 py-1.5 text-xs"
              >
                <div className="truncate">
                  <div className="text-foreground/80">{c.name}</div>
                  <div className="text-foreground/40">Qty: {c.qty}</div>
                </div>
                <span className="font-medium">{c.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-foreground/10 pt-2 text-xs">
            <div className="flex justify-between">
              <span className="text-foreground/60">Subtotal</span>
              <span>Rp 64.500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Tax 11%</span>
              <span>Rp 7.095</span>
            </div>
            <div className="mt-1 flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>Rp 71.595</span>
            </div>
          </div>
          <button
            type="button"
            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground"
          >
            Posting & Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Team Chat mockup                                                    */
/* ------------------------------------------------------------------ */
export function ChatMock() {
  const msgs = [
    { from: "me", text: "Restock kopi susu — sisa 24 di gudang A.", me: true },
    { from: "Rina", text: "OK, saya buatkan PO sekarang.", me: false },
    { from: "Andi", text: "PO-2031 sudah saya approve.", me: false },
    { from: "me", text: "Mantap. Stok masuk Jumat ya.", me: true },
  ];
  return (
    <div className="mock-window flex flex-col w-full">
      <WindowChrome title="managementokoku.id/chat/inventory" />
      <div className="flex">
        <div className="hidden md:flex w-32 shrink-0 flex-col border-r border-foreground/10 p-2 gap-1">
          {["Inventory", "Sales", "Finance", "Approval"].map((c, i) => (
            <span
              key={c}
              className={`rounded-md px-2 py-1.5 text-xs ${
                i === 0 ? "bg-primary/10 text-primary font-medium" : "text-foreground/60"
              }`}
            >
              # {c}
            </span>
          ))}
        </div>
        <div className="flex-1 p-3">
          <div className="flex items-center justify-between border-b border-foreground/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm"># Inventory</span>
              <span className="text-xs text-foreground/40">8 anggota</span>
            </div>
            <Users className="h-4 w-4 text-foreground/40" />
          </div>
          <div className="mt-2 space-y-2">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.me ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-1.5 text-xs ${
                    m.me
                      ? "bg-primary text-primary-foreground"
                      : "bg-foreground/[0.05] text-foreground/80"
                  }`}
                >
                  {!m.me ? (
                    <div className="mb-0.5 text-[10px] font-medium text-primary">
                      {m.from}
                    </div>
                  ) : null}
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-md border border-foreground/10 px-2 py-1.5">
            <span className="text-xs text-foreground/40">Ketik pesan…</span>
            <button
              type="button"
              className="ml-auto inline-flex h-7 items-center justify-center rounded-md bg-primary px-2 text-xs text-primary-foreground"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Login mockup (used in screenshot section)                           */
/* ------------------------------------------------------------------ */
export function LoginMock() {
  return (
    <div className="mock-window w-full">
      <WindowChrome title="managementokoku.id/login" />
      <div className="flex flex-col items-center gap-3 p-6">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold">
          F
        </span>
        <span className="text-base font-semibold">Login</span>
        <div className="w-full max-w-xs space-y-2">
          <div>
            <div className="text-xs text-foreground/60">Email</div>
            <div className="mt-1 h-9 rounded-md border border-foreground/15 bg-background" />
          </div>
          <div>
            <div className="text-xs text-foreground/60">Password</div>
            <div className="mt-1 h-9 rounded-md border border-foreground/15 bg-background" />
          </div>
          <button
            type="button"
            className="h-9 w-full rounded-md bg-primary text-xs font-medium text-primary-foreground"
          >
            Login
          </button>
          <div className="flex justify-between text-[10px] text-foreground/50">
            <span>Lupa Password?</span>
            <span className="text-primary">Register</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Register mockup                                                     */
/* ------------------------------------------------------------------ */
export function RegisterMock() {
  return (
    <div className="mock-window w-full">
      <WindowChrome title="managementokoku.id/register" />
      <div className="flex flex-col items-center gap-3 p-6">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold">
          F
        </span>
        <span className="text-base font-semibold">Register</span>
        <div className="w-full max-w-xs space-y-2">
          {["Nama Bisnis", "Nama Anda", "Email", "Password", "Konfirmasi Password"].map(
            (l) => (
              <div key={l}>
                <div className="text-xs text-foreground/60">{l}</div>
                <div className="mt-1 h-9 rounded-md border border-foreground/15 bg-background" />
              </div>
            ),
          )}
          <button
            type="button"
            className="h-9 w-full rounded-md bg-primary text-xs font-medium text-primary-foreground"
          >
            Register
          </button>
          <div className="text-center text-[10px] text-foreground/50">
            atau <span className="text-primary">Login</span>
          </div>
        </div>
      </div>
    </div>
  );
}
