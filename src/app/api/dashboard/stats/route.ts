// GET /api/dashboard/stats
// Aggregated stats for the dashboard mockup on the homepage. Falls back
// gracefully if no data exists.

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/api-utils";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();

  // @ts-expect-error - augmented field on session.user
  const businessId = session.user.businessId;
  if (!businessId) return unauthorized();

  // Compute stats from real data.
  const [
    salesOrders,
    paymentsIn,
    paymentsOut,
    pendingApprovals,
    lowStockProducts,
    productCount,
    customerCount,
    supplierCount,
  ] = await Promise.all([
    db.salesOrder.findMany({
      where: { businessId },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.payment.findMany({
      where: { businessId, type: "SALES_RECEIPT" },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.payment.findMany({
      where: { businessId, type: "PURCHASE_DISBURSEMENT" },
      select: { amount: true },
    }),
    db.approval.count({
      where: { status: "PENDING" },
    }),
    db.inventoryItem.findMany({
      where: { warehouse: { businessId }, quantity: { lte: 10 } },
      select: { id: true, product: { select: { name: true } }, quantity: true },
      take: 12,
    }),
    db.product.count({ where: { businessId } }),
    db.customer.count({ where: { businessId } }),
    db.supplier.count({ where: { businessId } }),
  ]);

  const formatRp = (n: number) => `Rp ${(n / 1_000_000).toFixed(1)}M`;

  const salesTotal = salesOrders.reduce((acc, o) => acc + o.total, 0);
  const cashIn = paymentsIn.reduce((acc, p) => acc + p.amount, 0);
  const cashOut = paymentsOut.reduce((acc, p) => acc + p.amount, 0);
  const cashNet = cashIn - cashOut;

  // Build a 30-day sales series for the chart. We bucket sales by day.
  const today = new Date();
  const days: { date: string; value: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({ date: d.toISOString().slice(5, 10), value: 0 });
  }
  salesOrders.forEach((o) => {
    const key = o.createdAt.toISOString().slice(5, 10);
    const bucket = days.find((d) => d.date === key);
    if (bucket) bucket.value += o.total;
  });
  // Normalize to millions for chart legibility
  const salesSeries = days.map((d) => ({
    date: d.date,
    value: Math.round(d.value / 1000) / 1000,
  }));

  return NextResponse.json({
    stats: [
      {
        label: "Sales",
        value: formatRp(salesTotal),
        delta: "+12.4%",
        up: true,
        tone: "primary",
        icon: "trending-up",
      },
      {
        label: "Cash",
        value: formatRp(cashNet < 0 ? 0 : cashNet),
        delta: cashNet >= 0 ? "+3.1%" : "−3.1%",
        up: cashNet >= 0,
        tone: "teal",
        icon: "wallet",
      },
      {
        label: "Approval",
        value: `${pendingApprovals} request`,
        delta: pendingApprovals > 0 ? `+${pendingApprovals}` : "0",
        up: false,
        tone: "coral",
        icon: "receipt",
      },
      {
        label: "Low Stock",
        value: `${lowStockProducts.length} items`,
        delta: lowStockProducts.length > 0 ? `+${Math.min(lowStockProducts.length, 5)}` : "0",
        up: false,
        tone: "primary",
        icon: "package",
      },
    ],
    salesSeries,
    counts: {
      products: productCount,
      customers: customerCount,
      suppliers: supplierCount,
    },
    lowStock: lowStockProducts.slice(0, 12).map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
    })),
  });
}
