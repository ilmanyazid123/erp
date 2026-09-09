// GET /api/dashboard/stats
// Aggregated stats for the main dashboard. Syncs ALL transactions:
// every sales order, purchase order and payment in a 60-day window
// (current 30 days + previous 30 days for real delta comparison),
// scoped to the signed-in user's business.
//
// MEMBER (staff/anggota) users get an operational variant: today's
// sales, order flow, items needing action, low stock, recent orders
// and a 7-day sales chart — no cash/finance figures (owner-only).

import { NextResponse } from "next/server";
import { getSession, getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/api-utils";

const LOW_STOCK_THRESHOLD = 10;

// Short Indonesian currency format: jt (juta), rb (ribu), M (miliar).
const formatRp = (n: number) => {
  if (n >= 1_000_000_000)
    return `Rp ${(n / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  if (n >= 1_000_000)
    return `Rp ${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (n >= 1_000)
    return `Rp ${(n / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} rb`;
  return `Rp ${n.toLocaleString("id-ID")}`;
};

const pctDelta = (cur: number, prev: number) => {
  if (prev === 0) return cur > 0 ? "baru" : "0%";
  const pct = ((cur - prev) / prev) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
};

// Operational dashboard for MEMBER (staff toko / user anggota).
async function memberStats(businessId: string) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 6); // 7 days incl. today

  const [
    soToday,
    poTodayCount,
    soYesterday,
    poYesterdayCount,
    draftSO,
    openPO,
    lowStockItems,
    lowStockCount,
    recentOrders,
    weekSOs,
  ] = await Promise.all([
    db.salesOrder.findMany({
      where: { businessId, createdAt: { gte: todayStart } },
      select: { total: true },
    }),
    db.purchaseOrder.count({
      where: { businessId, createdAt: { gte: todayStart } },
    }),
    db.salesOrder.findMany({
      where: {
        businessId,
        createdAt: { gte: yesterdayStart, lt: todayStart },
      },
      select: { total: true },
    }),
    db.purchaseOrder.count({
      where: {
        businessId,
        createdAt: { gte: yesterdayStart, lt: todayStart },
      },
    }),
    db.salesOrder.count({ where: { businessId, status: "DRAFT" } }),
    db.purchaseOrder.count({
      where: { businessId, status: { in: ["DRAFT", "SUBMITTED"] } },
    }),
    db.inventoryItem.findMany({
      where: { warehouse: { businessId }, quantity: { lte: LOW_STOCK_THRESHOLD } },
      select: { id: true, product: { select: { name: true } }, quantity: true },
      orderBy: { quantity: "asc" },
      take: 12,
    }),
    db.inventoryItem.count({
      where: { warehouse: { businessId }, quantity: { lte: LOW_STOCK_THRESHOLD } },
    }),
    db.salesOrder.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        code: true,
        total: true,
        status: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    }),
    db.salesOrder.findMany({
      where: {
        businessId,
        status: { not: "CANCELLED" },
        createdAt: { gte: weekStart },
      },
      select: { total: true, createdAt: true },
    }),
  ]);

  // 7-day per-day sales series for the staff chart.
  const days: { date: string; sales: number; purchases: number }[] = [];
  const dayIndex = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(todayStart.getDate() - i);
    const key = d.toISOString().slice(5, 10);
    dayIndex.set(key, days.length);
    days.push({ date: key, sales: 0, purchases: 0 });
  }
  weekSOs.forEach((o) => {
    const idx = dayIndex.get(o.createdAt.toISOString().slice(5, 10));
    if (idx !== undefined) days[idx].sales += o.total;
  });

  const salesToday = soToday.reduce((a, o) => a + o.total, 0);
  const salesYesterday = soYesterday.reduce((a, o) => a + o.total, 0);
  const ordersToday = soToday.length + poTodayCount;
  const ordersYesterday = soYesterday.length + poYesterdayCount;

  return NextResponse.json({
    role: "MEMBER",
    stats: [
      {
        label: "Penjualan hari ini",
        value: formatRp(salesToday),
        delta: pctDelta(salesToday, salesYesterday),
        up: salesToday >= salesYesterday,
        tone: "primary",
        icon: "trending-up",
      },
      {
        label: "Pesanan hari ini",
        value: `${ordersToday} pesanan`,
        delta: pctDelta(ordersToday, ordersYesterday),
        up: ordersToday >= ordersYesterday,
        tone: "teal",
        icon: "receipt",
      },
      {
        label: "Menunggu aksi",
        value: `${draftSO + openPO} pesanan`,
        delta: "perlu diproses",
        up: draftSO + openPO === 0,
        tone: "coral",
        icon: "clock",
      },
      {
        label: "Stok menipis",
        value: `${lowStockCount} item`,
        delta: lowStockCount > 0 ? "perlu restock" : "aman",
        up: lowStockCount === 0,
        tone: "primary",
        icon: "package",
      },
    ],
    salesSeries: days,
    lowStock: lowStockItems.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
    })),
    orders: recentOrders.map((o) => ({
      id: o.id,
      code: o.code,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      customer: o.customer.name,
    })),
  });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();

  // @ts-expect-error - augmented field on session.user
  const businessId = session.user.businessId;
  if (!businessId) return unauthorized();

  // Staff/anggota get the operational variant (no cash figures).
  const sessionUser = await getSessionUser();
  if (sessionUser?.role === "MEMBER") return memberStats(businessId);

  // Time windows: current 30 days + previous 30 days (for real deltas).
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const curStart = new Date(todayStart);
  curStart.setDate(todayStart.getDate() - 29); // 30-day window inclusive of today
  const prevStart = new Date(curStart);
  prevStart.setDate(curStart.getDate() - 30);

  const [
    salesOrders,
    purchaseOrders,
    payments,
    pendingApprovals,
    lowStockItems,
    lowStockCount,
    productCount,
    customerCount,
    supplierCount,
  ] = await Promise.all([
    // ALL sales orders in the 60-day window (no take-limit — full sync).
    db.salesOrder.findMany({
      where: {
        businessId,
        status: { not: "CANCELLED" },
        createdAt: { gte: prevStart },
      },
      select: { total: true, createdAt: true },
    }),
    // ALL purchase orders in the same window (previously missing entirely).
    db.purchaseOrder.findMany({
      where: {
        businessId,
        status: { not: "CANCELLED" },
        createdAt: { gte: prevStart },
      },
      select: { total: true, createdAt: true },
    }),
    // ALL payments in the window — both money in and money out.
    db.payment.findMany({
      where: { businessId, createdAt: { gte: prevStart } },
      select: { amount: true, type: true, createdAt: true },
    }),
    // Scope approvals to this business (was leaking a global count).
    db.approval.count({ where: { businessId, status: "PENDING" } }),
    db.inventoryItem.findMany({
      where: { warehouse: { businessId }, quantity: { lte: LOW_STOCK_THRESHOLD } },
      select: { id: true, product: { select: { name: true } }, quantity: true },
      orderBy: { quantity: "asc" },
      take: 12,
    }),
    // Real low-stock count (was capped at the list length before).
    db.inventoryItem.count({
      where: { warehouse: { businessId }, quantity: { lte: LOW_STOCK_THRESHOLD } },
    }),
    db.product.count({ where: { businessId } }),
    db.customer.count({ where: { businessId } }),
    db.supplier.count({ where: { businessId } }),
  ]);

  const inWindow = (d: Date, start: Date, end: Date) => d >= start && d < end;

  // ---- Totals: current 30 days vs previous 30 days ----
  let salesCur = 0, salesPrev = 0;
  let purchCur = 0, purchPrev = 0;
  let payInCur = 0, payInPrev = 0;
  let payOutCur = 0, payOutPrev = 0;

  // 30-day per-day buckets for the chart (raw rupiah values).
  const days: { date: string; sales: number; purchases: number }[] = [];
  const dayKeys: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(todayStart.getDate() - i);
    const key = d.toISOString().slice(5, 10);
    dayKeys.push(key);
    days.push({ date: key, sales: 0, purchases: 0 });
  }
  const dayIndex = new Map(dayKeys.map((k, idx) => [k, idx]));

  salesOrders.forEach((o) => {
    const t = o.createdAt.getTime();
    if (o.createdAt >= curStart) {
      salesCur += o.total;
      const idx = dayIndex.get(o.createdAt.toISOString().slice(5, 10));
      if (idx !== undefined) days[idx].sales += o.total;
    } else if (inWindow(o.createdAt, prevStart, curStart)) {
      salesPrev += o.total;
    }
    void t;
  });

  purchaseOrders.forEach((o) => {
    if (o.createdAt >= curStart) {
      purchCur += o.total;
      const idx = dayIndex.get(o.createdAt.toISOString().slice(5, 10));
      if (idx !== undefined) days[idx].purchases += o.total;
    } else if (inWindow(o.createdAt, prevStart, curStart)) {
      purchPrev += o.total;
    }
  });

  payments.forEach((p) => {
    const isOut = p.type === "PURCHASE_DISBURSEMENT";
    if (p.createdAt >= curStart) {
      if (isOut) payOutCur += p.amount;
      else payInCur += p.amount;
    } else if (inWindow(p.createdAt, prevStart, curStart)) {
      if (isOut) payOutPrev += p.amount;
      else payInPrev += p.amount;
    }
  });

  const netCur = payInCur - payOutCur;
  const netPrev = payInPrev - payOutPrev;

  const stats = [
    {
      label: "Penjualan (30 hari)",
      value: formatRp(salesCur),
      delta: pctDelta(salesCur, salesPrev),
      up: salesCur >= salesPrev,
      tone: "primary",
      icon: "trending-up",
    },
    {
      label: "Pembelian (30 hari)",
      value: formatRp(purchCur),
      delta: pctDelta(purchCur, purchPrev),
      up: purchCur >= purchPrev,
      tone: "coral",
      icon: "cart",
    },
    {
      label: "Kas bersih (30 hari)",
      value: formatRp(netCur),
      delta: pctDelta(netCur, netPrev),
      up: netCur >= netPrev,
      tone: "teal",
      icon: "wallet",
    },
    {
      label: "Stok menipis",
      value: `${lowStockCount} item`,
      delta: lowStockCount > 0 ? "perlu restock" : "aman",
      up: lowStockCount === 0,
      tone: "primary",
      icon: "package",
    },
  ];

  return NextResponse.json({
    stats,
    // Raw rupiah per day — formatted on the client with fmtRp.
    salesSeries: days,
    counts: {
      products: productCount,
      customers: customerCount,
      suppliers: supplierCount,
    },
    approvals: { pending: pendingApprovals },
    cash: {
      in: payInCur,
      out: payOutCur,
      net: netCur,
      inPrev: payInPrev,
      outPrev: payOutPrev,
      netPrev,
    },
    lowStock: lowStockItems.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
    })),
  });
}
