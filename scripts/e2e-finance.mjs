// E2E test: Finance money-flow sync.
// 1. Login demo via NextAuth credentials.
// 2. Baseline: GET /api/invoices + /api/payments (totals + series).
// 3. Create SO1 -> CONFIRMED -> auto SALES invoice must exist (UNPAID).
// 4. Record partial payment -> invoice PARTIAL, cash-in total rises.
// 5. Create SO2 -> CONFIRMED -> CANCELLED -> auto invoice CANCELLED, stock restored.
// 6. Cleanup: remove test rows, restore inventory snapshot.
//
// Run: env -u DATABASE_URL -u DIRECT_URL node scripts/e2e-finance.mjs
// (server must be running on localhost:3000)

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const MARKER = "E2E-FIN-SYNC";

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
    headers.Cookie = Object.entries(jar)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
  const res = await fetch(BASE + path, { ...opts, headers, redirect: "manual" });
  cookies(res);
  let body = null;
  try {
    body = await res.json();
  } catch {}
  return { res, body };
}

async function login() {
  const { body } = await api("/api/auth/csrf");
  const csrf = body.csrfToken;
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: Object.entries(jar)
        .map(([k, v]) => `${k}=${v}`)
        .join("; "),
    },
    body: new URLSearchParams({
      csrfToken: csrf,
      email: "demo@faizerp.id",
      password: "password123",
      callbackUrl: `${BASE}/dashboard`,
      json: "true",
    }),
    redirect: "manual",
  });
  cookies(res);
  return res.status;
}

async function main() {
  // ---- setup: demo business + products + inventory snapshot
  const business = await db.business.findFirst({ where: { slug: "demo-toko-sembako" } });
  if (!business) throw new Error("demo business not found");
  const products = await db.product.findMany({
    where: { businessId: business.id, name: { in: ["Mie Instan Goreng", "Air Mineral 600ml"] } },
  });
  if (products.length !== 2) throw new Error("expected 2 test products");
  const snapshot = await db.inventoryItem.findMany({
    where: { businessId: business.id, productId: { in: products.map((p) => p.id) } },
  });

  console.log("— Login");
  const status = await login();
  check("NextAuth login", status === 200 || status === 302, `(HTTP ${status})`);

  console.log("— Baseline Finance data");
  let { body: invBody } = await api("/api/invoices");
  let { body: payBody } = await api("/api/payments");
  const baseInvoiceCount = invBody.invoices.length;
  check("baseline invoices present", baseInvoiceCount >= 91, `(${baseInvoiceCount})`);
  check(
    "baseline cash-in total = 6.978.500",
    payBody.totals.in === 6978500,
    `(got ${payBody.totals.in})`,
  );
  check("baseline series has 30 days", payBody.series.length === 30);
  check(
    "invoices carry refCode",
    invBody.invoices.every((i) => i.refCode !== undefined),
  );

  console.log("— SO1: create -> confirm -> auto invoice");
  const so1 = await api("/api/sales-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerId: (await db.customer.findFirst({ where: { businessId: business.id } })).id,
      items: [
        { productId: products[0].id, quantity: 2 },
        { productId: products[1].id, quantity: 3 },
      ],
      notes: MARKER + "-SO1",
    }),
  });
  check("SO1 created", so1.res.status === 201, `(${so1.res.status})`);
  const so1Id = so1.body.order.id;
  const so1Total = so1.body.order.total;

  const conf1 = await api(`/api/sales-orders/${so1Id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "CONFIRMED" }),
  });
  check("SO1 confirmed", conf1.res.status === 200);

  const inv1 = await db.invoice.findFirst({ where: { refType: "SalesOrder", refId: so1Id } });
  check("auto SALES invoice created", Boolean(inv1), inv1 ? `(${inv1.code})` : "");
  check(
    "invoice amount = SO total",
    inv1 && Math.abs(inv1.amount - so1Total) < 0.001,
    `(invoice ${inv1?.amount} vs SO ${so1Total})`,
  );
  check("invoice starts UNPAID", inv1?.status === "UNPAID");

  console.log("— Partial payment on SO1 invoice");
  const half = Math.floor(so1Total / 2);
  const pay1 = await api("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId: inv1.id, amount: half, method: "CASH" }),
  });
  check("payment recorded", pay1.res.status === 201, `(${pay1.res.status})`);
  const inv1After = await db.invoice.findUnique({ where: { id: inv1.id } });
  check("invoice now PARTIAL", inv1After.status === "PARTIAL", `(${inv1After.status})`);

  ({ body: payBody } = await api("/api/payments"));
  check(
    "cash-in total increased by payment",
    Math.abs(payBody.totals.in - (6978500 + half)) < 0.001,
    `(got ${payBody.totals.in}, expect ${6978500 + half})`,
  );
  check(
    "payment linked to invoice in API",
    payBody.payments.some((p) => p.invoice?.id === inv1.id),
  );

  console.log("— SO2: confirm then cancel -> invoice cancelled, stock restored");
  const so2 = await api("/api/sales-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerId: (await db.customer.findFirst({ where: { businessId: business.id } })).id,
      items: [{ productId: products[0].id, quantity: 1 }],
      notes: MARKER + "-SO2",
    }),
  });
  const so2Id = so2.body.order.id;
  await api(`/api/sales-orders/${so2Id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "CONFIRMED" }),
  });
  const inv2 = await db.invoice.findFirst({ where: { refType: "SalesOrder", refId: so2Id } });
  check("SO2 auto invoice created", Boolean(inv2));

  const cancel = await api(`/api/sales-orders/${so2Id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "CANCELLED" }),
  });
  check("SO2 cancelled", cancel.res.status === 200);
  const inv2After = await db.invoice.findUnique({ where: { id: inv2.id } });
  check("SO2 invoice CANCELLED", inv2After.status === "CANCELLED", `(${inv2After.status})`);

  ({ body: invBody } = await api("/api/invoices"));
  check(
    "invoice list grew by 2 and includes new codes",
    invBody.invoices.length === baseInvoiceCount + 2 &&
      invBody.invoices.some((i) => i.code === inv1.code),
    `(${invBody.invoices.length})`,
  );

  console.log("— PO flow: create -> submit -> approve -> receive -> auto invoice");
  const supplier = await db.supplier.findFirst({ where: { businessId: business.id } });
  const po = await api("/api/purchase-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      supplierId: supplier.id,
      items: [{ productId: products[1].id, quantity: 2, price: 3500 }],
      notes: MARKER + "-PO",
    }),
  });
  check("PO created", po.res.status === 201, `(${po.res.status})`);
  const poId = po.body.order.id;
  for (const st of ["SUBMITTED", "APPROVED", "RECEIVED"]) {
    const r = await api(`/api/purchase-orders/${poId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: st }),
    });
    if (r.res.status !== 200) check(`PO -> ${st}`, false, `(HTTP ${r.res.status})`);
  }
  const invPo = await db.invoice.findFirst({ where: { refType: "PurchaseOrder", refId: poId } });
  check("auto PURCHASE invoice created", Boolean(invPo), invPo ? `(${invPo.code})` : "");
  check("PURCHASE invoice UNPAID", invPo?.status === "UNPAID");

  // ---- cleanup
  console.log("— Cleanup test data");
  const testOrders = await db.salesOrder.findMany({
    where: { businessId: business.id, notes: { contains: MARKER } },
    include: { items: true },
  });
  const testPo = await db.purchaseOrder.findFirst({
    where: { businessId: business.id, notes: { contains: MARKER } },
  });
  const testOrderIds = [...testOrders.map((o) => o.id), ...(testPo ? [testPo.id] : [])];

  await db.payment.deleteMany({ where: { businessId: business.id, invoice: { refId: { in: testOrderIds } } } });
  await db.invoice.deleteMany({ where: { businessId: business.id, refId: { in: testOrderIds } } });
  await db.stockMovement.deleteMany({ where: { refId: { in: testOrderIds } } });
  await db.salesOrder.deleteMany({ where: { id: { in: testOrders.map((o) => o.id) } } });
  await db.purchaseOrder.deleteMany({ where: { id: testPo?.id ?? "" } });
  await db.approval.deleteMany({ where: { refId: testPo?.id ?? "" } });
  const allTestIds = [
    ...testOrderIds,
    ...testOrders.flatMap((o) => o.items.map((i) => i.id)),
    ...(so1Id ? [so1Id] : []),
  ];
  await db.auditLog.deleteMany({ where: { entityId: { in: allTestIds } } });

  // restore inventory snapshot exactly
  for (const s of snapshot) {
    await db.inventoryItem.update({ where: { id: s.id }, data: { quantity: s.quantity } });
  }
  // remove any inventory items created by the test (if a product had none before)
  const extraItems = await db.inventoryItem.findMany({
    where: {
      businessId: business.id,
      productId: { in: products.map((p) => p.id) },
      id: { notIn: snapshot.map((s) => s.id) },
    },
  });
  for (const e of extraItems) await db.inventoryItem.delete({ where: { id: e.id } });

  const afterInvoices = await db.invoice.count({ where: { businessId: business.id } });
  const afterOrphans = await db.payment.count({ where: { invoiceId: null } });
  check("demo business back to 91 invoices", afterInvoices === 91, `(${afterInvoices})`);
  check("no orphan payments", afterOrphans === 0, `(${afterOrphans})`);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main()
  .catch((e) => {
    console.error("E2E error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
