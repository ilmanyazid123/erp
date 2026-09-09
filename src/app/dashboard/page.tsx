"use client";

// Main dashboard: KPI cards, 30-day transaction chart (sales + purchases),
// low stock list and the recent activity feed. Data comes from
// /api/dashboard/stats and /api/activities (both scoped to the signed-in
// user's business). Auto-refreshes every 30 seconds so new transactions
// show up without a manual reload.

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Package,
  Receipt,
  RotateCw,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { fmtRp, fmtDate, Loading, StatusBadge } from "@/components/dashboard/ui";

type StatsPayload = {
  role?: string;
  stats: Array<{
    label: string;
    value: string;
    delta: string;
    up: boolean;
    tone: "primary" | "teal" | "coral";
    icon: string;
  }>;
  salesSeries: Array<{ date: string; sales: number; purchases: number }>;
  lowStock: Array<{ name: string; quantity: number }>;
  orders?: Array<{
    id: string;
    code: string;
    total: number;
    status: string;
    createdAt: string;
    customer: string;
  }>;
};

type Activity = {
  id: string;
  label: string;
  timeAgo: string;
  tone: "primary" | "teal" | "coral";
  userName: string;
};

const ICONS: Record<string, typeof TrendingUp> = {
  "trending-up": TrendingUp,
  wallet: Wallet,
  receipt: Receipt,
  package: Package,
  cart: ShoppingCart,
  clock: Clock,
};

const TONE_BG: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  teal: "bg-[color:var(--teal)]/10 text-[color:var(--teal)]",
  coral: "bg-[color:var(--coral)]/10 text-[color:var(--coral)]",
};

const REFRESH_MS = 30_000;

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const loadedRef = useRef(false);

  // Loads stats + activities. Reused by initial mount, the refresh
  // button and the 30-second auto-sync interval.
  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [s, a] = await Promise.all([
        fetch("/api/dashboard/stats").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/activities").then((r) => (r.ok ? r.json() : null)),
      ]);
      if (s) {
        setStats(s);
        setError(null);
        loadedRef.current = true;
      } else if (!loadedRef.current) {
        setError("Gagal memuat statistik. Coba muat ulang halaman.");
      }
      if (a && Array.isArray(a.activities)) setActivities(a.activities);
      setLastUpdated(new Date());
    } catch {
      if (!loadedRef.current)
        setError("Gagal memuat statistik. Coba muat ulang halaman.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Initial load.
  useEffect(() => {
    load();
  }, [load]);

  // Auto-sync: re-fetch every 30 seconds (only while the tab is visible).
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const firstName = (session?.user?.name ?? "Pengguna").split(" ")[0];
  // MEMBER (staff toko / user anggota) gets the operational variant.
  const isMember =
    stats?.role === "MEMBER" || session?.user?.role === "MEMBER";
  const series = isMember
    ? (stats?.salesSeries ?? []).slice(-7)
    : (stats?.salesSeries ?? []);

  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-sm text-foreground/60">
        Selamat datang kembali, {firstName} 👋
      </p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-xl font-semibold sm:text-2xl">
          {isMember ? "Dashboard Toko" : "Ringkasan bisnis hari ini"}
        </h2>
        <button
          type="button"
          onClick={load}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/10 bg-card px-2.5 py-1 text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
          aria-label="Segarkan data"
        >
          <RotateCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          Segarkan
        </button>
        {lastUpdated ? (
          <span className="text-xs text-foreground/40">
            Diperbarui{" "}
            {lastUpdated.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-[color:var(--coral)]/30 bg-[color:var(--coral)]/5 px-3 py-2 text-sm text-[color:var(--coral)]"
        >
          {error}
        </div>
      ) : null}

      {!stats ? (
        !error ? (
          <Loading label="Mengambil data bisnis..." />
        ) : null
      ) : (
        <>
          {/* KPI cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.stats.map((s) => {
              const Icon = ICONS[s.icon] ?? TrendingUp;
              return (
                <div
                  key={s.label}
                  className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${TONE_BG[s.tone]}`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        s.up ? "text-emerald-600" : "text-[color:var(--coral)]"
                      }`}
                    >
                      {s.up ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {s.delta}
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold tracking-tight">
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-sm text-foreground/60">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Chart + side panel */}
          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">
                    {isMember ? "Penjualan 7 hari" : "Transaksi 30 hari"}
                  </h3>
                  <p className="text-xs text-foreground/50">
                    {isMember
                      ? "Nilai pesanan penjualan per hari"
                      : "Nilai pesanan penjualan & pembelian per hari"}
                  </p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={series}
                    margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="purchaseFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--coral)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="var(--coral)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      interval={isMember ? 0 : 4}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      width={45}
                      tickFormatter={(v: number) =>
                        v >= 1_000_000
                          ? `${(v / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}jt`
                          : v >= 1_000
                            ? `${Math.round(v / 1_000)}rb`
                            : `${v}`
                      }
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        fmtRp(Number(value)),
                        name === "sales" ? "Penjualan" : "Pembelian",
                      ]}
                      labelStyle={{ fontSize: 12, color: "var(--foreground)" }}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        fontSize: 12,
                      }}
                    />
                    {isMember ? null : (
                      <Legend
                        formatter={(value) =>
                          value === "sales" ? "Penjualan" : "Pembelian"
                        }
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12 }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#salesFill)"
                    />
                    {isMember ? null : (
                      <Area
                        type="monotone"
                        dataKey="purchases"
                        stroke="var(--coral)"
                        strokeWidth={2}
                        fill="url(#purchaseFill)"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Low stock */}
            <div className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Stok menipis</h3>
                <span className="inline-flex h-6 items-center rounded-full bg-[color:var(--coral)]/10 px-2 text-[11px] font-medium text-[color:var(--coral)]">
                  {stats.lowStock.length} item
                </span>
              </div>
              {stats.lowStock.length === 0 ? (
                <p className="py-8 text-center text-sm text-foreground/50">
                  Semua stok aman 👍
                </p>
              ) : (
                <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
                  {stats.lowStock.map((i) => (
                    <li
                      key={i.name}
                      className="flex items-center justify-between rounded-lg border border-foreground/10 px-3 py-2"
                    >
                      <span className="truncate text-sm">{i.name}</span>
                      <span
                        className={`ml-2 shrink-0 text-xs font-semibold ${
                          i.quantity <= 3
                            ? "text-[color:var(--coral)]"
                            : "text-amber-600"
                        }`}
                      >
                        {i.quantity} unit
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Recent orders — operational panel for staff/anggota */}
          {isMember && stats.orders ? (
            <div className="mt-6 rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Pesanan terbaru</h3>
                <span className="inline-flex h-6 items-center rounded-full bg-primary/10 px-2 text-[11px] font-medium text-primary">
                  {stats.orders.length} SO
                </span>
              </div>
              {stats.orders.length === 0 ? (
                <p className="py-4 text-sm text-foreground/50">
                  Belum ada pesanan penjualan.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-foreground/5">
                  {stats.orders.map((o) => (
                    <li
                      key={o.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5"
                    >
                      <span className="font-mono text-xs text-foreground/60">
                        {o.code}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {o.customer}
                      </span>
                      <StatusBadge status={o.status} />
                      <span className="w-24 shrink-0 text-right text-sm font-medium">
                        {fmtRp(o.total)}
                      </span>
                      <span className="w-20 shrink-0 text-right text-xs text-foreground/50">
                        {fmtDate(o.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {/* Activities */}
          <div className="mt-6 rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold">Aktivitas terakhir</h3>
            {!activities ? (
              <p className="py-4 text-sm text-foreground/50">Memuat aktivitas...</p>
            ) : activities.length === 0 ? (
              <p className="py-4 text-sm text-foreground/50">
                Belum ada aktivitas tercatat.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-foreground/5">
                {activities.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        a.tone === "teal"
                          ? "bg-[color:var(--teal)]"
                          : a.tone === "coral"
                            ? "bg-[color:var(--coral)]"
                            : "bg-primary"
                      }`}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {a.label}
                      <span className="text-foreground/50"> · {a.userName}</span>
                    </span>
                    <span className="shrink-0 text-xs text-foreground/50">
                      {a.timeAgo}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
