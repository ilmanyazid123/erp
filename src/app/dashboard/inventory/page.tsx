"use client";

// Inventory: product master data with search + create/edit/delete.

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ExportButton } from "@/components/dashboard/export-button";
import {
  EmptyState,
  ErrorNote,
  FormDialog,
  Loading,
  PageHeading,
  fmtRp,
  ghostBtnCls,
  inputCls,
  labelCls,
  primaryBtnCls,
} from "@/components/dashboard/ui";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  unit: string | null;
  priceSell: number;
  priceBuy: number;
  inventory: Array<{ quantity: number }>;
};

const emptyForm = {
  sku: "",
  name: "",
  category: "",
  unit: "",
  priceBuy: "",
  priceSell: "",
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (q: string) => {
    try {
      const res = await fetch(
        `/api/products${q ? `?search=${encodeURIComponent(q)}` : ""}`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(data.products);
      setError(null);
    } catch {
      setError("Gagal memuat daftar produk.");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      sku: p.sku,
      name: p.name,
      category: p.category ?? "",
      unit: p.unit ?? "",
      priceBuy: String(p.priceBuy),
      priceSell: String(p.priceSell),
    });
    setDialogOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        sku: form.sku,
        name: form.name,
        category: form.category || null,
        unit: form.unit || null,
        priceBuy: Number(form.priceBuy) || 0,
        priceSell: Number(form.priceSell) || 0,
      };
      const res = editing
        ? await fetch(`/api/products/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan produk.");
      setDialogOpen(false);
      await load(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan produk.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${deleting.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menghapus produk.");
      setDeleting(null);
      await load(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus produk.");
      setDeleting(null);
    } finally {
      setSaving(false);
    }
  }

  const stockOf = (p: Product) =>
    p.inventory.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeading
        title="Inventory"
        subtitle="Kelola master data produk, harga, dan stok."
        action={
          <div className="flex flex-wrap items-center gap-2">
          <ExportButton entity="products" />
          <button type="button" onClick={openCreate} className={primaryBtnCls}>
            <Plus className="h-4 w-4" />
            Tambah Produk
          </button>
          </div>
        }
      />

      {error ? <ErrorNote message={error} /> : null}

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau SKU..."
          aria-label="Cari produk"
          className={`${inputCls} pl-9`}
        />
      </div>

      {!products ? (
        <Loading />
      ) : products.length === 0 ? (
        <EmptyState
          title="Belum ada produk"
          description="Tambahkan produk pertama Anda untuk mulai mencatat stok dan transaksi."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-foreground/10 bg-card shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-4 py-3 font-medium">Produk</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium text-right">Stok</th>
                <th className="px-4 py-3 font-medium text-right">Harga Beli</th>
                <th className="px-4 py-3 font-medium text-right">Harga Jual</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {products.map((p) => {
                const stock = stockOf(p);
                return (
                  <tr key={p.id} className="transition-colors hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-foreground/50">
                        {p.sku}
                        {p.unit ? ` · ${p.unit}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-foreground/70">
                      {p.category ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold ${
                          stock <= 10 ? "text-[color:var(--coral)]" : ""
                        }`}
                      >
                        {stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-foreground/70">
                      {fmtRp(p.priceBuy)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {fmtRp(p.priceSell)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          aria-label={`Edit ${p.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(p)}
                          aria-label={`Hapus ${p.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / edit dialog */}
      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Produk" : "Tambah Produk"}
        description={
          editing
            ? "Perbarui informasi produk yang dipilih."
            : "Produk baru akan langsung tersedia untuk transaksi."
        }
      >
        <form className="flex flex-col gap-3" onSubmit={save}>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>SKU *</span>
              <input
                required
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className={inputCls}
                placeholder="SKU-001"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Satuan</span>
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className={inputCls}
                placeholder="pcs / kg / box"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Nama Produk *</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              placeholder="Beras Premium 5kg"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Kategori</span>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputCls}
              placeholder="Sembako"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Harga Beli</span>
              <input
                type="number"
                min="0"
                step="any"
                value={form.priceBuy}
                onChange={(e) => setForm({ ...form, priceBuy: e.target.value })}
                className={inputCls}
                placeholder="0"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Harga Jual</span>
              <input
                type="number"
                min="0"
                step="any"
                value={form.priceSell}
                onChange={(e) => setForm({ ...form, priceSell: e.target.value })}
                className={inputCls}
                placeholder="0"
              />
            </label>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className={ghostBtnCls}
            >
              Batal
            </button>
            <button type="submit" disabled={saving} className={primaryBtnCls}>
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </FormDialog>

      {/* Delete confirm */}
      <FormDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Hapus produk?"
        description={
          deleting
            ? `Produk "${deleting.name}" akan dihapus permanen. Riwayat transaksi yang memakai produk ini tidak ikut terhapus.`
            : ""
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className={ghostBtnCls}
            >
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
