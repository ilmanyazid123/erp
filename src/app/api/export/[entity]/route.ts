// GET /api/export/[entity]?format=xlsx|csv
// Exports the current business's data for Excel / Google Sheets.
// OWNER only — sharing data outside the app is the owner's decision.
//
// Entities: invoices, payments, sales, purchases, products, inventory,
// customers, suppliers. format=xlsx (default) → Excel workbook;
// format=csv → semicolon-separated CSV with BOM (opens in Excel ID locale
// and imports into Google Sheets).

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSessionUser, isOwner, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, apiError } from "@/lib/api-utils";

const fmtDate = (d: Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(d) : "";

const fmtRp = (n: number) => Math.round(n * 100) / 100;

type Row = Record<string, string | number>;

async function buildRows(entity: string, businessId: string | null): Promise<Row[]> {
  switch (entity) {
    case "businesses": {
      // Platform-wide list — ADMIN only (guarded below).
      const rows = await db.business.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          users: { select: { name: true, email: true, role: true } },
          products: { select: { id: true } },
          sales: { select: { id: true, total: true } },
          subscription: { select: { plan: true, status: true } },
        },
      });
      return rows.map((b) => {
        const owner = b.users.find((u) => u.role === "OWNER");
        const staff = b.users.filter((u) => u.role === "MEMBER");
        return {
          "Nama Toko": b.name,
          Slug: b.slug,
          Pemilik: owner?.name ?? "",
          "Email Pemilik": owner?.email ?? "",
          "Jumlah Staff": staff.length,
          "Nama Staff": staff.map((s) => s.name ?? s.email).join(", "),
          "Jumlah Produk": b.products.length,
          "Jumlah Pesanan Penjualan": b.sales.length,
          "Total Penjualan (Rp)": fmtRp(b.sales.reduce((a, o) => a + o.total, 0)),
          Paket: b.subscription?.plan ?? "",
          "Status Paket": b.subscription?.status ?? "",
          Dibuat: fmtDate(b.createdAt),
        };
      });
    }
    case "invoices": {
      const rows = await db.invoice.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
          supplier: { select: { name: true } },
        },
      });
      return rows.map((i) => ({
        Kode: i.code,
        Tipe: i.type === "SALES" ? "Penjualan" : "Pembelian",
        Pihak: i.customer?.name ?? i.supplier?.name ?? "",
        "Total (Rp)": fmtRp(i.amount),
        "Dibayar (Rp)": fmtRp(i.paidAmount),
        "Sisa (Rp)": fmtRp(i.amount - i.paidAmount),
        Status: i.status,
        "Jatuh Tempo": fmtDate(i.dueDate),
        Dibuat: fmtDate(i.createdAt),
      }));
    }
    case "payments": {
      const rows = await db.payment.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        include: { invoice: { select: { code: true } } },
      });
      return rows.map((p) => ({
        Tanggal: fmtDate(p.createdAt),
        Jenis: p.type === "SALES_RECEIPT" ? "Uang Masuk" : "Uang Keluar",
        Invoice: p.invoice?.code ?? "",
        "Jumlah (Rp)": fmtRp(p.amount),
        Metode: p.method ?? "",
        Catatan: p.notes ?? "",
      }));
    }
    case "sales": {
      const rows = await db.salesOrder.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { name: true } } },
      });
      return rows.map((o) => ({
        Kode: o.code,
        Pelanggan: o.customer?.name ?? "",
        Status: o.status,
        "Total (Rp)": fmtRp(o.total),
        Tanggal: fmtDate(o.createdAt),
        Catatan: o.notes ?? "",
      }));
    }
    case "purchases": {
      const rows = await db.purchaseOrder.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        include: { supplier: { select: { name: true } } },
      });
      return rows.map((o) => ({
        Kode: o.code,
        Pemasok: o.supplier?.name ?? "",
        Status: o.status,
        "Total (Rp)": fmtRp(o.total),
        Tanggal: fmtDate(o.createdAt),
        Catatan: o.notes ?? "",
      }));
    }
    case "products": {
      const rows = await db.product.findMany({
        where: { businessId },
        orderBy: { name: "asc" },
        include: { inventory: { select: { quantity: true } } },
      });
      return rows.map((p) => ({
        SKU: p.sku ?? "",
        Barcode: p.barcode ?? "",
        Nama: p.name,
        Kategori: p.category ?? "",
        Merek: p.brand ?? "",
        Satuan: p.unit ?? "",
        "Harga Jual (Rp)": fmtRp(p.priceSell),
        "Harga Beli (Rp)": fmtRp(p.priceBuy),
        Stok: p.inventory.reduce((a, i) => a + i.quantity, 0),
      }));
    }
    case "inventory": {
      const rows = await db.inventoryItem.findMany({
        where: { businessId },
        orderBy: [{ warehouse: { name: "asc" } }],
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { name: true } },
        },
      });
      return rows.map((i) => ({
        Produk: i.product.name,
        SKU: i.product.sku ?? "",
        Gudang: i.warehouse.name,
        Qty: i.quantity,
      }));
    }
    case "customers": {
      const rows = await db.customer.findMany({
        where: { businessId },
        orderBy: { name: "asc" },
      });
      return rows.map((c) => ({
        Nama: c.name,
        Email: c.email ?? "",
        Telepon: c.phone ?? "",
        Alamat: c.address ?? "",
        Dibuat: fmtDate(c.createdAt),
      }));
    }
    case "suppliers": {
      const rows = await db.supplier.findMany({
        where: { businessId },
        orderBy: { name: "asc" },
      });
      return rows.map((s) => ({
        Nama: s.name,
        Email: s.email ?? "",
        Telepon: s.phone ?? "",
        Alamat: s.address ?? "",
        Dibuat: fmtDate(s.createdAt),
      }));
    }
    default:
      return [];
  }
}

const TITLES: Record<string, string> = {
  invoices: "Invoice",
  payments: "Pembayaran",
  sales: "Pesanan Penjualan",
  purchases: "Pesanan Pembelian",
  products: "Produk",
  inventory: "Stok Inventory",
  customers: "Pelanggan",
  suppliers: "Pemasok",
  businesses: "Daftar Toko",
};

function toCsv(rows: Row[], sep = ";"): string {
  if (rows.length === 0) return "\uFEFF";
  const headers = Object.keys(rows[0]);
  const esc = (v: string | number) => {
    const s = String(v);
    return new RegExp(`["${sep}\n]`).test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(sep)];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h] ?? "")).join(sep));
  // BOM so Excel reads UTF-8 correctly.
  return "\uFEFF" + lines.join("\r\n");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ entity: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { entity } = await params;

  // Platform-wide export is admin-only; business data exports are owner-only.
  let scopeBusinessId: string | null = null;
  if (entity === "businesses") {
    if (!isAdmin(user)) {
      return apiError("Ekspor daftar toko hanya dapat dilakukan administrator.", 403);
    }
  } else {
    if (!user.businessId) return unauthorized();
    if (!isOwner(user)) {
      return apiError("Ekspor data hanya dapat dilakukan pemilik toko.", 403);
    }
    scopeBusinessId = user.businessId;
  }

  if (!TITLES[entity]) {
    return apiError("Jenis data tidak dikenal.", 404);
  }

  const rows = await buildRows(entity, scopeBusinessId);
  const format = new URL(req.url).searchParams.get("format") ?? "xlsx";
  const slug = TITLES[entity].toLowerCase().replace(/\s+/g, "-");
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    return new NextResponse(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}-${stamp}.csv"`,
      },
    });
  }

  if (format === "tsv") {
    // Tab-separated, no BOM — meant for clipboard paste into Google Sheets.
    return new NextResponse(toCsv(rows, "\t"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // xlsx (default)
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: "Belum ada data" }]);
  const cols = Object.keys(rows[0] ?? { Info: "" });
  ws["!cols"] = cols.map((h) => ({
    wch: Math.min(
      32,
      Math.max(h.length + 2, ...rows.slice(0, 200).map((r) => String(r[h] ?? "").length + 2)),
    ),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, TITLES[entity].slice(0, 31));
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${slug}-${stamp}.xlsx"`,
    },
  });
}
