"use client";

// Purchasing: purchase orders with supplier, line items, status flow and
// approval wiring. Status: DRAFT -> SUBMITTED -> APPROVED -> RECEIVED.

import { useCallback, useEffect, useState } from "react";
import { Plus, ScanLine, Search, Trash2 } from "lucide-react";
import { ExportButton } from "@/components/dashboard/export-button";
import {
  BarcodeScanner,
  type ScanStatus,
} from "@/components/dashboard/barcode-scanner";
import {
  EmptyState,
  ErrorNote,
  FormDialog,
  Loading,
  PageHeading,
  StatusBadge,
  fmtDate,
  fmtRp,
  ghostBtnCls,
  inputCls,
  labelCls,
  primaryBtnCls,
} from "@/components/dashboard/ui";

type Item = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  total: number;
  product: { id: string; name: string; unit: string | null };
};

type PO = {
  id: string;
  code: string;
  status: string;
  total: number;
  notes: string | null;
  createdAt: string;
  supplier: { id: string; name: string };
  items: Item[];
};

type Supplier = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  unit: string | null;
  priceBuy: number;
  inventory?: Array<{ quantity: number }>;
};

type DraftItem = { productId: string; quantity: string; price: string };

const emptyDraft: DraftItem = { productId: "", quantity: "1", price: "" };

// Which action button to show for a given status.
const NEXT_ACTION: Record<string, { label: string; status: string } | undefined> = {
  DRAFT: { label: "Ajukan", status: "SUBMITTED" },
  SUBMITTED: { label: "Setujui", status: "APPROVED" },
  APPROVED: { label: "Terima Barang", status: "RECEIVED" },
};

export default function PurchasingPage() {
  const [orders, setOrders] = useState<PO[] | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // create dialog state
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([{ ...emptyDraft }]);
  const [saving, setSaving] = useState(false);

  // Barcode scanner state
  const [scanOpen, setScanOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>(null);

  const load = useCallback(async (q: string) => {
    try {
      const res = await fetch(
        `/api/purchase-orders${q ? `?search=${encodeURIComponent(q)}` : ""}`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.orders);
      setError(null);
    } catch {
      setError("Gagal memuat daftar pembelian.");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  useEffect(() => {
    Promise.all([
      fetch("/api/suppliers").then((r) => (r.ok ? r.json() : { suppliers: [] })),
      fetch("/api/products").then((r) => (r.ok ? r.json() : { products: [] })),
    ])
      .then(([s, p]) => {
        setSuppliers(s.suppliers ?? []);
        setProducts(p.products ?? []);
      })
      .catch(() => {});
  }, []);

  const productById = (id: string) => products.find((p) => p.id === id);

  // Called by the barcode scanner: look up the scanned code and add the
  // matching product to the draft (or bump its quantity if already there).
  const handleScan = useCallback(async (code: string) => {
    try {
      const res = await fetch(
        `/api/products?barcode=${encodeURIComponent(code)}`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      const p: Product | undefined = data.products?.[0];
      if (!p) {
        setScanStatus({
          ok: false,
          text: `Barcode "${code}" tidak ditemukan. Daftarkan dulu di Inventory (field Barcode).`,
        });
        return;
      }
      const stock = p.inventory?.reduce((a, i) => a + i.quantity, 0);
      setDraftItems((prev) => {
        const same = prev.findIndex((i) => i.productId === p.id);
        if (same >= 0) {
          const next = [...prev];
          next[same] = {
            ...next[same],
            quantity: String((Number(next[same].quantity) || 0) + 1),
          };
          return next;
        }
        const empty = prev.findIndex((i) => !i.productId);
        if (empty >= 0) {
          const next = [...prev];
          next[empty] = { ...next[empty], productId: p.id, quantity: "1", price: "" };
          return next;
        }
        return [...prev, { productId: p.id, quantity: "1", price: "" }];
      });
      setScanStatus({
        ok: true,
        text: `${p.name} ditambahkan ke pembelian${stock !== undefined ? ` · stok ${stock}` : ""}`,
      });
    } catch {
      setScanStatus({ ok: false, text: "Gagal mencari produk. Coba scan ulang." });
    }
  }, []);

  const draftTotal = draftItems.reduce((acc, it) => {
    const price = it.price !== "" ? Number(it.price) : productById(it.productId)?.priceBuy ?? 0;
    return acc + (Number(it.quantity) || 0) * (price || 0);
  }, 0);

  async function createPO(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const items = draftItems
        .filter((i) => i.productId)
        .map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity) || 0,
          price: i.price !== "" ? Number(i.price) : undefined,
        }));
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, notes, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat PO.");
      setOpen(false);
      setScanOpen(false);
      setScanStatus(null);
      setSupplierId("");
      setNotes("");
      setDraftItems([{ ...emptyDraft }]);
      await load(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat PO.");
    } finally {
      setSaving(false);
    }
  }

  async function advance(po: PO, status: string) {
    setBusyId(po.id);
    setError(null);
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memperbarui status.");
      await load(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui status.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeading
        title="Purchasing"
        subtitle="Pesanan pembelian ke pemasok, lengkap dengan alur persetujuan."
        action={
          <div className="flex flex-wrap items-center gap-2">
          <ExportButton entity="purchases" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={primaryBtnCls}
            disabled={suppliers.length === 0 || products.length === 0}
            title={
              suppliers.length === 0
                ? "Tambahkan pemasok di Master Data terlebih dahulu"
                : products.length === 0
                  ? "Tambahkan produk di Inventory terlebih dahulu"
                  : undefined
            }
          >
            <Plus className="h-4 w-4" />
            PO Baru
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
          placeholder="Cari kode atau pemasok..."
          aria-label="Cari pesanan pembelian"
          className={`${inputCls} pl-9`}
        />
      </div>

      {!orders ? (
        <Loading />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Belum ada pesanan pembelian"
          description="Buat PO pertama untuk mencatat pembelian stok dari pemasok."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-foreground/10 bg-card shadow-sm">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium">Pemasok</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {orders.map((po) => {
                const next = NEXT_ACTION[po.status];
                return (
                  <tr key={po.id} className="transition-colors hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3 font-medium">{po.code}</td>
                    <td className="px-4 py-3 text-foreground/70">{po.supplier.name}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-foreground/60">
                      {po.items
                        .map(
                          (i) =>
                            `${i.product.name} ×${i.quantity}`,
                        )
                        .join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{fmtRp(po.total)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="px-4 py-3 text-foreground/60">
                      {fmtDate(po.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {next ? (
                          <button
                            type="button"
                            disabled={busyId === po.id}
                            onClick={() => advance(po, next.status)}
                            className="inline-flex h-8 items-center rounded-md bg-primary/10 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
                          >
                            {busyId === po.id ? "..." : next.label}
                          </button>
                        ) : null}
                        {["DRAFT", "SUBMITTED", "APPROVED"].includes(po.status) ? (
                          <button
                            type="button"
                            disabled={busyId === po.id}
                            onClick={() => advance(po, "CANCELLED")}
                            aria-label={`Batalkan ${po.code}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/50 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create PO dialog */}
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Pesanan Pembelian Baru"
        description="Pilih pemasok lalu tambahkan produk yang dibeli."
        wide
      >
        <form className="flex flex-col gap-4" onSubmit={createPO}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Pemasok *</span>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className={inputCls}
              >
                <option value="">— Pilih pemasok —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Catatan</span>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputCls}
                placeholder="Opsional"
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className={labelCls}>Item *</span>
            <button
              type="button"
              onClick={() => {
                setScanStatus(null);
                setScanOpen(true);
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary/10 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <ScanLine className="h-4 w-4" />
              Scan Barcode
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {draftItems.map((item, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2">
                <select
                  required
                  value={item.productId}
                  onChange={(e) => {
                    const next = [...draftItems];
                    next[idx] = { ...next[idx], productId: e.target.value };
                    setDraftItems(next);
                  }}
                  className={`${inputCls} min-w-[180px] flex-1`}
                  aria-label={`Produk item ${idx + 1}`}
                >
                  <option value="">— Pilih produk —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={item.quantity}
                  onChange={(e) => {
                    const next = [...draftItems];
                    next[idx] = { ...next[idx], quantity: e.target.value };
                    setDraftItems(next);
                  }}
                  className={`${inputCls} w-20`}
                  aria-label={`Jumlah item ${idx + 1}`}
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.price}
                  onChange={(e) => {
                    const next = [...draftItems];
                    next[idx] = { ...next[idx], price: e.target.value };
                    setDraftItems(next);
                  }}
                  placeholder={String(productById(item.productId)?.priceBuy ?? 0)}
                  className={`${inputCls} w-32`}
                  aria-label={`Harga item ${idx + 1}`}
                />
                {draftItems.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setDraftItems(draftItems.filter((_, i) => i !== idx))
                    }
                    aria-label={`Hapus item ${idx + 1}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/50 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setDraftItems([...draftItems, { ...emptyDraft }])}
              className="self-start text-sm font-medium text-primary hover:underline"
            >
              + Tambah baris
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-foreground/[0.03] px-4 py-3">
            <span className="text-sm text-foreground/70">Total</span>
            <span className="text-base font-semibold">{fmtRp(draftTotal)}</span>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className={ghostBtnCls}>
              Batal
            </button>
            <button type="submit" disabled={saving} className={primaryBtnCls}>
              {saving ? "Menyimpan..." : "Buat PO"}
            </button>
          </div>
        </form>
      </FormDialog>

      {/* Barcode / QR scanner (camera + manual fallback) */}
      <BarcodeScanner
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onDetected={handleScan}
        title="Scan Produk — Pembelian"
        status={scanStatus}
      />
    </div>
  );
}
