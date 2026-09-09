// Backfill Finance data so the money flow from existing sales & purchases
// shows up in the Finance menu. Bulk/idempotent version.
//
// For every business:
//   1. CONFIRMED / DELIVERED sales orders without an invoice get a SALES
//      invoice. If an orphan SALES_RECEIPT payment matches (same amount,
//      same day — how the demo seed created them), the invoice is marked
//      PAID and the payment is linked to it. Otherwise the invoice stays
//      UNPAID so the owner can record the payment in Finance.
//   2. RECEIVED purchase orders without an invoice get a PURCHASE invoice
//      (payable), with the same matching for PURCHASE_DISBURSEMENT orphans.
//
// Run with: env -u DATABASE_URL -u DIRECT_URL npx tsx scripts/backfill-finance.ts

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Dedicated client without query logging (faster + less noise than src/lib/db).
const db = new PrismaClient();

function add14Days(d: Date) {
  const due = new Date(d);
  due.setDate(due.getDate() + 14);
  return due;
}

function sameDay(a: Date, b: Date) {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

async function linkPayments(
  businessId: string,
  toCreate: Array<{ orderId: string; paymentId: string | null }>,
) {
  if (!toCreate.some((t) => t.paymentId)) return;
  const created = await db.invoice.findMany({
    where: {
      businessId,
      refId: { in: toCreate.map((t) => t.orderId) },
    },
    select: { id: true, refId: true },
  });
  const byRef = new Map(created.map((c) => [c.refId, c.id]));
  for (const t of toCreate) {
    if (!t.paymentId) continue;
    const invoiceId = byRef.get(t.orderId);
    if (invoiceId) {
      await db.payment.update({
        where: { id: t.paymentId },
        data: { invoiceId },
      });
    }
  }
}

async function backfillSalesOrders(businessId: string, label: string) {
  const existing = await db.invoice.findMany({
    where: { businessId, refType: "SalesOrder" },
    select: { refId: true },
  });
  const existingRefs = new Set(existing.map((i) => i.refId));

  const sos = await db.salesOrder.findMany({
    where: { businessId, status: { in: ["CONFIRMED", "DELIVERED"] } },
    orderBy: { createdAt: "asc" },
  });

  const orphanReceipts = await db.payment.findMany({
    where: { businessId, type: "SALES_RECEIPT", invoiceId: null },
  });
  const used = new Set<string>();

  const toCreate: Array<{
    orderId: string;
    paymentId: string | null;
    paid: boolean;
    so: { code: string; customerId: string | null; total: number; createdAt: Date };
  }> = [];

  for (const so of sos) {
    if (existingRefs.has(so.id)) continue;
    const match =
      orphanReceipts.find(
        (p) =>
          !used.has(p.id) &&
          p.amount === so.total &&
          p.createdAt.getTime() === so.createdAt.getTime(),
      ) ??
      orphanReceipts.find(
        (p) => !used.has(p.id) && p.amount === so.total && sameDay(p.createdAt, so.createdAt),
      );
    if (match) used.add(match.id);
    toCreate.push({
      orderId: so.id,
      paymentId: match ? match.id : null,
      paid: Boolean(match),
      so: { code: so.code, customerId: so.customerId, total: so.total, createdAt: so.createdAt },
    });
  }

  if (toCreate.length) {
    await db.invoice.createMany({
      data: toCreate.map((t) => ({
        businessId,
        type: "SALES",
        code: `INV-${t.so.code}`,
        customerId: t.so.customerId,
        refType: "SalesOrder",
        refId: t.orderId,
        amount: t.so.total,
        dueDate: add14Days(t.so.createdAt),
        ...(t.paid ? { paidAmount: t.so.total, status: "PAID" } : {}),
      })),
    });
    await linkPayments(businessId, toCreate);
  }

  console.log(
    `[${label}] sales orders: ${sos.length} → created paid: ${
      toCreate.filter((t) => t.paid).length
    }, unpaid: ${toCreate.filter((t) => !t.paid).length}, skipped(existing): ${
      sos.length - toCreate.length
    }`,
  );
}

async function backfillPurchaseOrders(businessId: string, label: string) {
  const existing = await db.invoice.findMany({
    where: { businessId, refType: "PurchaseOrder" },
    select: { refId: true },
  });
  const existingRefs = new Set(existing.map((i) => i.refId));

  const pos = await db.purchaseOrder.findMany({
    where: { businessId, status: "RECEIVED" },
    orderBy: { createdAt: "asc" },
  });

  const orphanDisb = await db.payment.findMany({
    where: { businessId, type: "PURCHASE_DISBURSEMENT", invoiceId: null },
  });
  const used = new Set<string>();

  const toCreate: Array<{
    orderId: string;
    paymentId: string | null;
    paid: boolean;
    po: { code: string; supplierId: string | null; total: number; createdAt: Date };
  }> = [];

  for (const po of pos) {
    if (existingRefs.has(po.id)) continue;
    const match = orphanDisb.find(
      (p) => !used.has(p.id) && p.amount === po.total,
    );
    if (match) used.add(match.id);
    toCreate.push({
      orderId: po.id,
      paymentId: match ? match.id : null,
      paid: Boolean(match),
      po: { code: po.code, supplierId: po.supplierId, total: po.total, createdAt: po.createdAt },
    });
  }

  if (toCreate.length) {
    await db.invoice.createMany({
      data: toCreate.map((t) => ({
        businessId,
        type: "PURCHASE",
        code: `INV-${t.po.code}`,
        supplierId: t.po.supplierId,
        refType: "PurchaseOrder",
        refId: t.orderId,
        amount: t.po.total,
        dueDate: add14Days(t.po.createdAt),
        ...(t.paid ? { paidAmount: t.po.total, status: "PAID" } : {}),
      })),
    });
    await linkPayments(businessId, toCreate);
  }

  console.log(
    `[${label}] purchase orders received: ${pos.length} → created paid: ${
      toCreate.filter((t) => t.paid).length
    }, unpaid: ${toCreate.filter((t) => !t.paid).length}, skipped(existing): ${
      pos.length - toCreate.length
    }`,
  );
}

async function main() {
  console.log("🔧 Backfilling Finance invoices from existing orders...");

  const businesses = await db.business.findMany({ select: { id: true, name: true } });

  for (const b of businesses) {
    console.log(`\n— Business: ${b.name} (${b.id})`);
    await backfillSalesOrders(b.id, b.name);
    await backfillPurchaseOrders(b.id, b.name);
  }

  const [invoiceCount, orphanCount] = await Promise.all([
    db.invoice.count(),
    db.payment.count({ where: { invoiceId: null } }),
  ]);
  console.log(`\n✓ Total invoices now: ${invoiceCount}. Orphan payments left: ${orphanCount}`);
}

main()
  .catch((err) => {
    console.error("Backfill error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
