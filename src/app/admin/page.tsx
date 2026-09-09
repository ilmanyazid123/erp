"use client";

// Admin Panel: platform-wide overview for the website administrator.
// Shows every toko (business), its owner, staff, activity, plus export.

import { useCallback, useEffect, useState } from "react";
import { Building2, Users, Package, ShoppingCart, Wallet, ShieldCheck } from "lucide-react";
import {
  EmptyState,
  ErrorNote,
  Loading,
  PageHeading,
  StatusBadge,
  fmtDate,
  fmtRp,
} from "@/components/dashboard/ui";
import { ExportButton } from "@/components/dashboard/export-button";

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  owner: { name?: string | null; email: string } | null;
  staffCount: number;
  staff: { name?: string | null; email: string }[];
  productCount: number;
  salesOrderCount: number;
  salesTotal: number;
  plan: string | null;
  planStatus: string | null;
};

type Stats = {
  businessCount: number;
  ownerCount: number;
  staffCount: number;
  productCount: number;
  salesOrderCount: number;
  purchaseOrderCount: number;
  salesTotal: number;
  paymentTotal: number;
};

export default function AdminPage() {
  const [data, setData] = useState<{ stats: Stats; businesses: BusinessRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/overview");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Gagal memuat data.");
      setData(body);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const statCards = data
    ? [
        { label: "Total Toko", value: String(data.stats.businessCount), icon: Building2 },
        { label: "Pemilik Toko", value: String(data.stats.ownerCount), icon: Users },
        { label: "Staff Toko", value: String(data.stats.staffCount), icon: Users },
        { label: "Total Produk", value: String(data.stats.productCount), icon: Package },
        { label: "Pesanan Penjualan", value: String(data.stats.salesOrderCount), icon: ShoppingCart },
        {
          label: "Total Transaksi Tercatat",
          value: fmtRp(data.stats.paymentTotal),
          icon: Wallet,
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeading
        title="Admin Panel"
        subtitle="Kelola dan pantau seluruh toko yang tergabung di platform Managemen Tokoku."
        action={<ExportButton entity="businesses" label="Ekspor Daftar Toko" />}
      />

      {error ? <ErrorNote message={error} /> : null}

      {!data ? (
        <Loading />
      ) : (
        <>
          {/* Platform stat cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {statCards.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-foreground/10 bg-card p-4 shadow-sm"
              >
                <Icon className="h-4 w-4 text-foreground/40" />
                <p className="mt-2 text-lg font-semibold leading-tight">{value}</p>
                <p className="text-xs text-foreground/60">{label}</p>
              </div>
            ))}
          </div>

          {/* Businesses table */}
          {data.businesses.length === 0 ? (
            <EmptyState
              title="Belum ada toko terdaftar"
              description="Setiap pengguna baru yang mendaftar akan otomatis muncul di sini sebagai pemilik toko."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-foreground/10 bg-card shadow-sm">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
                    <th className="px-4 py-3 font-medium">Toko</th>
                    <th className="px-4 py-3 font-medium">Pemilik</th>
                    <th className="px-4 py-3 font-medium">Staff</th>
                    <th className="px-4 py-3 font-medium text-right">Produk</th>
                    <th className="px-4 py-3 font-medium text-right">Penjualan</th>
                    <th className="px-4 py-3 font-medium text-right">Nilai Order</th>
                    <th className="px-4 py-3 font-medium">Paket</th>
                    <th className="px-4 py-3 font-medium">Bergabung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {data.businesses.map((b) => (
                    <tr key={b.id} className="align-top transition-colors hover:bg-foreground/[0.02]">
                      <td className="px-4 py-3">
                        <p className="font-medium">{b.name}</p>
                        <p className="text-xs text-foreground/50">/{b.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        {b.owner ? (
                          <>
                            <p className="font-medium">{b.owner.name ?? "—"}</p>
                            <p className="text-xs text-foreground/50">{b.owner.email}</p>
                          </>
                        ) : (
                          <span className="text-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] font-medium">
                          {b.staffCount}/5
                        </span>
                        {b.staff.length > 0 ? (
                          <p className="mt-1 max-w-[180px] truncate text-xs text-foreground/50">
                            {b.staff.map((s) => s.name ?? s.email).join(", ")}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">{b.productCount}</td>
                      <td className="px-4 py-3 text-right">{b.salesOrderCount}</td>
                      <td className="px-4 py-3 text-right font-medium">{fmtRp(b.salesTotal)}</td>
                      <td className="px-4 py-3">
                        {b.plan ? (
                          <StatusBadge status={`${b.plan} · ${b.planStatus ?? ""}`} />
                        ) : (
                          <span className="text-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground/60">{fmtDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-foreground/70">
              <span className="font-medium text-foreground">Hierarki akses:</span>{" "}
              Administrator (Anda) mengelola seluruh website → Owner mengelola tokonya
              dan dapat menambah maksimal 5 staff jaga toko → Staff mengakses menu
              operasional (Dashboard, Inventory, Purchasing, Sales, Master Data) tanpa
              data keuangan dan pengaturan.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
