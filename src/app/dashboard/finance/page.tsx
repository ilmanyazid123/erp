"use client";

// Finance: invoices with payment status + record payments.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
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

type PaymentLite = { id: string; amount: number; method: string | null; createdAt: string };

type Invoice = {
  id: string;
  type: string;
  code: string;
  amount: number;
  paidAmount: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  customer: { id: string; name: string } | null;
  supplier: { id: string; name: string } | null;
  payments: PaymentLite[];
};

type PaymentRow = {
  id: string;
  amount: number;
  method: string | null;
  createdAt: string;
  type: string;
  invoice: { id: string; code: string; type: string } | null;
};

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [payments, setPayments] = useState<PaymentRow[] | null>(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  // payment dialog
  const [open, setOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [invRes, payRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/payments"),
      ]);
      if (!invRes.ok || !payRes.ok) throw new Error();
      const inv = await invRes.json();
      const pay = await payRes.json();
      setInvoices(inv.invoices);
      setPayments(pay.payments);
      setError(null);
    } catch {
      setError("Gagal memuat data keuangan.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openInvoices = useMemo(
    () => (invoices ?? []).filter((i) => i.status === "UNPAID" || i.status === "PARTIAL"),
    [invoices],
  );

  const summary = useMemo(() => {
    const list = invoices ?? [];
    const total = list.reduce((a, i) => a + i.amount, 0);
    const paid = list.reduce((a, i) => a + i.paidAmount, 0);
    return { total, paid, outstanding: total - paid };
  }, [invoices]);

  const selectedInvoice = openInvoices.find((i) => i.id === invoiceId);

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          amount: Number(amount),
          method,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mencatat pembayaran.");
      setOpen(false);
      setInvoiceId("");
      setAmount("");
      setMethod("CASH");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencatat pembayaran.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = (invoices ?? []).filter(
    (i) =>
      !filter ||
      i.code.toLowerCase().includes(filter.toLowerCase()) ||
      (i.customer?.name ?? "").toLowerCase().includes(filter.toLowerCase()) ||
      (i.supplier?.name ?? "").toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeading
        title="Finance"
        subtitle="Tagihan penjualan & pembelian beserta status pembayarannya."
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={primaryBtnCls}
            disabled={openInvoices.length === 0}
            title={
              openInvoices.length === 0
                ? "Tidak ada invoice yang belum lunas"
                : undefined
            }
          >
            <Plus className="h-4 w-4" />
            Catat Pembayaran
          </button>
        }
      />

      {error ? <ErrorNote message={error} /> : null}

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
          <p className="text-sm text-foreground/60">Total Tagihan</p>
          <p className="mt-1 text-xl font-semibold">{fmtRp(summary.total)}</p>
        </div>
        <div className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
          <p className="text-sm text-foreground/60">Sudah Diterima/Dibayar</p>
          <p className="mt-1 text-xl font-semibold text-[color:var(--teal)]">
            {fmtRp(summary.paid)}
          </p>
        </div>
        <div className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
          <p className="text-sm text-foreground/60">Belum Dibayar</p>
          <p className="mt-1 text-xl font-semibold text-[color:var(--coral)]">
            {fmtRp(summary.outstanding)}
          </p>
        </div>
      </div>

      {/* Invoices */}
      {!invoices ? (
        <Loading />
      ) : invoices.length === 0 ? (
        <EmptyState
          title="Belum ada invoice"
          description="Invoice muncul otomatis saat pesanan penjualan/pembelian ditagihkan."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-foreground/10 bg-card shadow-sm">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 font-medium">Pihak</th>
                <th className="px-4 py-3 font-medium">Jatuh Tempo</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Dibayar</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {filtered.map((inv) => (
                <tr key={inv.id} className="transition-colors hover:bg-foreground/[0.02]">
                  <td className="px-4 py-3 font-medium">{inv.code}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        inv.type === "SALES"
                          ? "bg-primary/10 text-primary"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {inv.type === "SALES" ? "Penjualan" : "Pembelian"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">
                    {inv.customer?.name ?? inv.supplier?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground/60">{fmtDate(inv.dueDate)}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmtRp(inv.amount)}</td>
                  <td className="px-4 py-3 text-right text-foreground/70">
                    {fmtRp(inv.paidAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent payments */}
      {payments && payments.length > 0 ? (
        <div className="mt-6 rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Pembayaran terakhir</h3>
          <ul className="flex flex-col divide-y divide-foreground/5">
            {payments.slice(0, 8).map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    p.type === "SALES_RECEIPT"
                      ? "bg-[color:var(--teal)]"
                      : "bg-amber-500"
                  }`}
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {p.invoice?.code ?? "Tanpa invoice"}
                  <span className="text-foreground/50">
                    {" "}
                    · {p.type === "SALES_RECEIPT" ? "Penerimaan" : "Pengeluaran"}
                    {p.method ? ` · ${p.method}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium">{fmtRp(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Record payment dialog */}
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Catat Pembayaran"
        description="Pilih invoice yang belum lunas lalu masukkan jumlah pembayaran."
      >
        <form className="flex flex-col gap-3" onSubmit={recordPayment}>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Invoice *</span>
            <select
              required
              value={invoiceId}
              onChange={(e) => {
                setInvoiceId(e.target.value);
                const inv = openInvoices.find((i) => i.id === e.target.value);
                if (inv) setAmount(String(inv.amount - inv.paidAmount));
              }}
              className={inputCls}
            >
              <option value="">— Pilih invoice —</option>
              {openInvoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.code} · sisa {fmtRp(i.amount - i.paidAmount)}
                </option>
              ))}
            </select>
          </label>
          {selectedInvoice ? (
            <p className="rounded-lg bg-foreground/[0.03] px-3 py-2 text-xs text-foreground/60">
              Total {fmtRp(selectedInvoice.amount)} · sudah dibayar{" "}
              {fmtRp(selectedInvoice.paidAmount)} · sisa{" "}
              {fmtRp(selectedInvoice.amount - selectedInvoice.paidAmount)}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Jumlah *</span>
              <input
                required
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
                placeholder="0"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Metode</span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className={inputCls}
              >
                <option value="CASH">Tunai</option>
                <option value="TRANSFER">Transfer</option>
                <option value="BANK">Bank</option>
                <option value="QRIS">QRIS</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Catatan</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputCls}
              placeholder="Opsional"
            />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className={ghostBtnCls}>
              Batal
            </button>
            <button type="submit" disabled={saving} className={primaryBtnCls}>
              {saving ? "Menyimpan..." : "Simpan Pembayaran"}
            </button>
          </div>
        </form>
      </FormDialog>
    </div>
  );
}
