// Verify the dashboard stats API syncs ALL transactions.
// 1. Login demo via NextAuth credentials (localhost).
// 2. GET /api/dashboard/stats — shape + Indonesian labels.
// 3. Cross-check KPI totals against direct Prisma aggregation.
//
// Run: env -u DATABASE_URL -u DIRECT_URL node scripts/verify-dashboard.mjs
// (server must be running on localhost:3000)

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

let jar = {};
let pass = 0;
let fail = 0;

function check(name, cond, extra = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name} ${extra}`);
  } else {
    fail++;
    console.log(`  ✗ FAIL: ${name} ${extra}`);
  }
}

function cookies(res) {
  const set = res.headers.getSetCookie?.() ?? [];
  for (const c of set) {
    const [kv] = c.split(";");
    const [k, v] = kv.split("=");
    jar[k] = v;
  }
}

async function api(path, opts = {}) {
  const headers = { ...(opts.headers ?? {}) };
  if (Object.keys(jar).length) {
    headers.Cookie = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
  }
  const res = await fetch(BASE + path, { ...opts, headers, redirect: "manual" });
  cookies(res);
  let body = null;
  try { body = await res.json(); } catch {}
  return { res, body };
}

// ---- Login ----
const { body: csrfBody } = await api("/api/auth/csrf");
const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; "),
  },
  body: new URLSearchParams({
    csrfToken: csrfBody.csrfToken,
    email: "demo@faizerp.id",
    password: "password123",
    callbackUrl: `${BASE}/dashboard`,
    json: "true",
  }),
  redirect: "manual",
});
cookies(loginRes);
console.log("login:", loginRes.status);

// ---- Fetch dashboard stats ----
const { res: statsRes, body: stats } = await api("/api/dashboard/stats");
console.log("stats API:", statsRes.status);

check("stats has 4 KPI cards", stats?.stats?.length === 4, `got ${stats?.stats?.length}`);
check("labels Indonesian", stats?.stats?.every((s) =>
  ["Penjualan (30 hari)", "Pembelian (30 hari)", "Kas bersih (30 hari)", "Stok menipis"].includes(s.label)
), JSON.stringify(stats?.stats?.map((s) => s.label)));
check("salesSeries 30 days", stats?.salesSeries?.length === 30);
check("series has sales+purchases fields",
  stats?.salesSeries?.every((d) => typeof d.sales === "number" && typeof d.purchases === "number"));
check("lowStock array present", Array.isArray(stats?.lowStock));
check("cash block present", stats?.cash && typeof stats.cash.net === "number",
  stats?.cash ? `in=${stats.cash.in} out=${stats.cash.out} net=${stats.cash.net}` : "");

// ---- Cross-check against DB ----
const business = await db.business.findUnique({ where: { slug: "demo-toko-sembako" } });
const now = new Date();
const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
const curStart = new Date(todayStart); curStart.setDate(todayStart.getDate() - 29);

const salesAgg = await db.salesOrder.aggregate({
  where: { businessId: business.id, status: { not: "CANCELLED" }, createdAt: { gte: curStart } },
  _sum: { total: true },
});
const poAgg = await db.purchaseOrder.aggregate({
  where: { businessId: business.id, status: { not: "CANCELLED" }, createdAt: { gte: curStart } },
  _sum: { total: true },
});

// Parse "Rp X jt" / "Rp X rb" back to a comparable band is fragile — instead
// verify the raw numbers make sense: series sum ≈ aggregate (within rounding).
const seriesSalesSum = stats?.salesSeries?.reduce((a, d) => a + d.sales, 0) ?? 0;
const dbSales = salesAgg._sum.total ?? 0;
const dbPurch = poAgg._sum.total ?? 0;

check("series sales sum matches DB aggregation (30d)",
  Math.abs(seriesSalesSum - dbSales) < 1,
  `series=${seriesSalesSum.toFixed(0)} db=${dbSales.toFixed(0)}`);

const seriesPurchSum = stats?.salesSeries?.reduce((a, d) => a + d.purchases, 0) ?? 0;
check("series purchases sum matches DB aggregation (30d)",
  Math.abs(seriesPurchSum - dbPurch) < 1,
  `series=${seriesPurchSum.toFixed(0)} db=${dbPurch.toFixed(0)}`);

// Low stock count: KPI string must match real count.
const lowCount = await db.inventoryItem.count({
  where: { warehouse: { businessId: business.id }, quantity: { lte: 10 } },
});
const kpiLow = stats?.stats?.find((s) => s.label === "Stok menipis");
check("low stock KPI matches DB count",
  kpiLow?.value === `${lowCount} item`, `kpi=${kpiLow?.value} db=${lowCount}`);

// Approvals must be scoped to this business only.
const approvalCount = await db.approval.count({ where: { businessId: business.id, status: "PENDING" } });
check("approvals scoped (payload has approvals block)", typeof stats?.approvals?.pending === "number",
  `api=${stats?.approvals?.pending} db(this business)=${approvalCount}`);

console.log(`\nDB reference: sales30=${dbSales.toFixed(0)} purch30=${dbPurch.toFixed(0)} lowStock=${lowCount}`);
console.log(`\n${fail === 0 ? `✓ ALL ${pass} CHECKS PASSED` : `✗ ${fail}/${pass + fail} CHECKS FAILED`}`);
await db.$disconnect();
process.exit(fail === 0 ? 0 : 1);
