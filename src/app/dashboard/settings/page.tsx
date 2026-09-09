"use client";

// Settings: business profile, subscription info, and sign-out.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Save } from "lucide-react";
import {
  ErrorNote,
  Loading,
  PageHeading,
  StatusBadge,
  fmtDate,
  ghostBtnCls,
  inputCls,
  labelCls,
  primaryBtnCls,
} from "@/components/dashboard/ui";

type Business = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

type Subscription = {
  plan: string;
  status: string;
  trialEndsAt: string | null;
} | null;

type Counts = {
  users: number;
  products: number;
  customers: number;
  suppliers: number;
  warehouses: number;
};

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [business, setBusiness] = useState<Business | null>(null);
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setBusiness(d.business);
          setName(d.business.name);
          setSubscription(d.subscription);
          setCounts(d.counts);
        } else {
          setError("Gagal memuat pengaturan.");
        }
      })
      .catch(() => setError("Gagal memuat pengaturan."))
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan.");
      setBusiness(data.business);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        title="Pengaturan"
        subtitle="Profil bisnis, langganan, dan preferensi workspace."
      />

      {error ? <ErrorNote message={error} /> : null}
      {saved ? (
        <div
          role="status"
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
        >
          Perubahan berhasil disimpan.
        </div>
      ) : null}

      {/* Business profile */}
      <section className="rounded-xl border border-foreground/10 bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold">Profil Bisnis</h3>
        <p className="mt-1 text-xs text-foreground/50">
          Nama bisnis tampil di sidebar dan seluruh aplikasi.
        </p>
        <form className="mt-4 flex flex-col gap-3" onSubmit={save}>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Nama Bisnis</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Slug Workspace</span>
            <input
              value={business?.slug ?? ""}
              disabled
              className={`${inputCls} opacity-60`}
            />
            <span className="text-xs text-foreground/40">
              Slug dipakai sebagai identitas workspace dan tidak bisa diubah.
            </span>
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className={primaryBtnCls}>
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            {business ? (
              <span className="text-xs text-foreground/50">
                Dibuat {fmtDate(business.createdAt)}
              </span>
            ) : null}
          </div>
        </form>
      </section>

      {/* Subscription */}
      <section className="mt-4 rounded-xl border border-foreground/10 bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold">Langganan</h3>
        {subscription ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
              {subscription.plan}
            </span>
            <StatusBadge status={subscription.status} />
            {subscription.trialEndsAt ? (
              <span className="text-xs text-foreground/60">
                Masa uji berakhir {fmtDate(subscription.trialEndsAt)}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-foreground/60">
            Belum ada data langganan.
          </p>
        )}

        {counts ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Pengguna", value: counts.users },
              { label: "Produk", value: counts.products },
              { label: "Pelanggan", value: counts.customers },
              { label: "Pemasok", value: counts.suppliers },
              { label: "Gudang", value: counts.warehouses },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-lg border border-foreground/10 px-3 py-2.5 text-center"
              >
                <p className="text-lg font-semibold">{c.value}</p>
                <p className="text-[11px] text-foreground/50">{c.label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Account */}
      <section className="mt-4 rounded-xl border border-foreground/10 bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold">Akun</h3>
        <p className="mt-1 text-xs text-foreground/50">
          Masuk sebagai{" "}
          <span className="font-medium text-foreground/80">
            {session?.user?.email ?? "—"}
          </span>
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className={`${ghostBtnCls} mt-4 text-[color:var(--coral)]`}
        >
          <LogOut className="h-4 w-4" />
          Keluar dari akun
        </button>
      </section>
    </div>
  );
}
