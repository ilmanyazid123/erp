"use client";

// Master data: customers & suppliers (CRUD), users (read-only), warehouses.

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportButton } from "@/components/dashboard/export-button";
import {
  EmptyState,
  ErrorNote,
  FormDialog,
  Loading,
  fmtDate,
  fmtRp,
  ghostBtnCls,
  inputCls,
  labelCls,
  primaryBtnCls,
} from "@/components/dashboard/ui";

type Party = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
};

type TeamUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
};

type WarehouseRow = {
  id: string;
  name: string;
  code: string | null;
  branch: { name: string } | null;
  inventory: Array<{ quantity: number }>;
};

const emptyForm = { name: "", email: "", phone: "", address: "" };

// Shared tab component for customers and suppliers (identical fields).
function PartyTab({ kind }: { kind: "customers" | "suppliers" }) {
  const isCustomer = kind === "customers";
  const [rows, setRows] = useState<Party[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<Party | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/${kind}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data[kind]);
      setError(null);
    } catch {
      setError(
        isCustomer ? "Gagal memuat pelanggan." : "Gagal memuat pemasok.",
      );
    }
  }, [kind, isCustomer]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan.");
      setOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/${kind}/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menghapus.");
      setDeleting(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
      setDeleting(null);
    } finally {
      setSaving(false);
    }
  }

  const noun = isCustomer ? "Pelanggan" : "Pemasok";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-foreground/60">
          Daftar {noun.toLowerCase()} bisnis Anda.
        </p>
        <button type="button" onClick={() => setOpen(true)} className={primaryBtnCls}>
          <Plus className="h-4 w-4" />
          Tambah {noun}
        </button>
      </div>

      {error ? <ErrorNote message={error} /> : null}

      {!rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState
          title={`Belum ada ${noun.toLowerCase()}`}
          description={`Tambahkan ${noun.toLowerCase()} pertama untuk mulai mencatat transaksi.`}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-foreground/10 bg-card shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Kontak</th>
                <th className="px-4 py-3 font-medium">Alamat</th>
                <th className="px-4 py-3 font-medium">Terdaftar</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {rows.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-foreground/[0.02]">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-foreground/70">
                    {r.email ?? "—"}
                    {r.phone ? (
                      <span className="block text-xs text-foreground/50">{r.phone}</span>
                    ) : null}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-foreground/60">
                    {r.address ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground/60">{fmtDate(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setDeleting(r)}
                      aria-label={`Hapus ${r.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={`Tambah ${noun}`}
        description={`Data ${noun.toLowerCase()} bisa langsung dipakai di transaksi.`}
      >
        <form className="flex flex-col gap-3" onSubmit={save}>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Nama *</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              placeholder={isCustomer ? "Toko Berkah" : "PT Sumber Makmur"}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
                placeholder="opsional"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Telepon</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputCls}
                placeholder="08xx"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Alamat</span>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputCls}
              placeholder="opsional"
            />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className={ghostBtnCls}>
              Batal
            </button>
            <button type="submit" disabled={saving} className={primaryBtnCls}>
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </FormDialog>

      <FormDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title={`Hapus ${noun.toLowerCase()}?`}
        description={
          deleting
            ? `"${deleting.name}" akan dihapus permanen dari master data.`
            : ""
        }
        footer={
          <>
            <button type="button" onClick={() => setDeleting(null)} className={ghostBtnCls}>
              Batal
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? "Menghapus..." : "Hapus"}
            </button>
          </>
        }
      >
        <span />
      </FormDialog>
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  OWNER: "Pemilik Toko",
  MANAGER: "Manajer",
  MEMBER: "Staff Toko",
};

const emptyStaffForm = { name: "", email: "", password: "" };

function TeamTab() {
  const { data: session } = useSession();
  const isOwner = (session?.user as unknown as { role?: string } | undefined)?.role === "OWNER";

  const [users, setUsers] = useState<TeamUser[] | null>(null);
  const [staffCount, setStaffCount] = useState(0);
  const [maxStaff, setMaxStaff] = useState(5);
  const [error, setError] = useState<string | null>(null);

  // add-staff dialog
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyStaffForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<TeamUser | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      const d = await res.json();
      setUsers(d.users ?? []);
      setStaffCount(d.staffCount ?? 0);
      setMaxStaff(d.maxStaff ?? 5);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menambah staff.");
      setOpen(false);
      setForm(emptyStaffForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah staff.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/team/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menghapus.");
      setDeleting(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
      setDeleting(null);
    } finally {
      setSaving(false);
    }
  }

  const quotaFull = staffCount >= maxStaff;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground/60">
          Tim toko Anda: pemilik + {staffCount} dari {maxStaff} staff jaga toko.
          Staff dapat mengakses menu operasional, tanpa data keuangan & pengaturan.
        </p>
        {isOwner ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={primaryBtnCls}
            disabled={quotaFull}
            title={quotaFull ? `Kuota staff penuh (maksimal ${maxStaff})` : undefined}
          >
            <Plus className="h-4 w-4" />
            Tambah Staff
          </button>
        ) : null}
      </div>

      {error ? <ErrorNote message={error} /> : null}

      {!users ? (
        <Loading />
      ) : users.length === 0 ? (
        <EmptyState title="Belum ada pengguna" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-foreground/10 bg-card shadow-sm">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Peran</th>
                <th className="px-4 py-3 font-medium">Bergabung</th>
                {isOwner ? <th className="px-4 py-3 font-medium text-right">Aksi</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-foreground/[0.02]">
                  <td className="px-4 py-3 font-medium">{u.name ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground/70">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        u.role === "OWNER"
                          ? "bg-primary/10 text-primary"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/60">{fmtDate(u.createdAt)}</td>
                  {isOwner ? (
                    <td className="px-4 py-3 text-right">
                      {u.role === "MEMBER" ? (
                        <button
                          type="button"
                          onClick={() => setDeleting(u)}
                          aria-label={`Hapus ${u.name ?? u.email}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add staff dialog */}
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Tambah Staff"
        description={`Buat akun untuk staf yang jaga toko (maksimal ${maxStaff} staff per toko). Staff login dengan email + password ini.`}
      >
        <form className="flex flex-col gap-3" onSubmit={addStaff}>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Nama *</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              placeholder="cth. Budi Santoso"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Email *</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls}
              placeholder="staff@toko.id"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Password *</span>
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputCls}
              placeholder="Minimal 6 karakter"
            />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className={ghostBtnCls}>
              Batal
            </button>
            <button type="submit" disabled={saving} className={primaryBtnCls}>
              {saving ? "Menyimpan..." : "Simpan Staff"}
            </button>
          </div>
        </form>
      </FormDialog>

      {/* Delete confirm */}
      <FormDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus Staff"
        description={`Hapus akun ${deleting?.name ?? deleting?.email ?? ""}? Staff tidak akan bisa login lagi.`}
      >
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={() => setDeleting(null)} className={ghostBtnCls}>
            Batal
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </FormDialog>
    </div>
  );
}

function WarehouseTab() {
  const [rows, setRows] = useState<WarehouseRow[] | null>(null);

  useEffect(() => {
    fetch("/api/warehouses")
      .then((r) => (r.ok ? r.json() : { warehouses: [] }))
      .then((d) => setRows(d.warehouses))
      .catch(() => setRows([]));
  }, []);

  if (!rows) return <Loading />;

  return (
    <div>
      <p className="mb-4 text-sm text-foreground/60">
        Lokasi penyimpanan stok bisnis Anda.
      </p>
      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada gudang"
          description="Gudang dibuat otomatis saat transaksi pertama dicatat."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((w) => {
            const totalUnits = w.inventory.reduce((a, i) => a + i.quantity, 0);
            return (
              <div
                key={w.id}
                className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{w.name}</p>
                    <p className="text-xs text-foreground/50">
                      {w.code ?? "—"} · {w.branch?.name ?? "Tanpa cabang"}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {totalUnits} unit
                  </span>
                </div>
                <p className="mt-3 text-xs text-foreground/50">
                  {w.inventory.length} produk terdaftar di gudang ini
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MasterPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">Master Data</h2>
          <p className="mt-1 text-sm text-foreground/60">
            Data dasar yang dipakai semua modul: pelanggan, pemasok, tim, dan gudang.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton entity="customers" label="Ekspor Pelanggan" />
          <ExportButton entity="suppliers" label="Ekspor Pemasok" />
        </div>
      </div>

      <Tabs defaultValue="customers">
        <TabsList className="mb-4">
          <TabsTrigger value="customers">Pelanggan</TabsTrigger>
          <TabsTrigger value="suppliers">Pemasok</TabsTrigger>
          <TabsTrigger value="team">Pengguna</TabsTrigger>
          <TabsTrigger value="warehouses">Gudang</TabsTrigger>
        </TabsList>
        <TabsContent value="customers">
          <PartyTab kind="customers" />
        </TabsContent>
        <TabsContent value="suppliers">
          <PartyTab kind="suppliers" />
        </TabsContent>
        <TabsContent value="team">
          <TeamTab />
        </TabsContent>
        <TabsContent value="warehouses">
          <WarehouseTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
