// Verify barcode scanning support + member (anggota) dashboard.
// 1. Login demo (OWNER).
// 2. Product CRUD with barcode (create temp -> lookup by barcode -> patch -> delete).
// 3. Lookup existing demo product by its backfilled barcode.
// 4. Owner dashboard stats: owner labels present.
// 5. MEMBER user dashboard: role=MEMBER payload, no cash fields, orders list.
//
// Run: env -u DATABASE_URL -u DIRECT_URL node scripts/verify-barcode-member.mjs
// (server must be running on localhost:3000 — or set BASE_URL)

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const MARKER = `89999E2E${Date.now().toString().slice(-5)}`;

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
  const headers = { ...(opts.headers ?? {}), "Content-Type": "application/json" };
  if (Object.keys(jar).length) {
    headers.Cookie = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
  }
  const res = await fetch(BASE + path, { ...opts, headers, redirect: "manual" });
  cookies(res);
  let body = null;
  try { body = await res.json(); } catch {}
  return { res, body };
}

async function login(email, password) {
  jar = {};
  const { body: csrfBody } = await api("/api/auth/csrf");
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; "),
    },
    body: new URLSearchParams({
      csrfToken: csrfBody.csrfToken,
      email,
      password,
      callbackUrl: `${BASE}/dashboard`,
      json: "true",
    }),
    redirect: "manual",
  });
  cookies(res);
  return res.status;
}

// ---- 1. Login as demo OWNER ----
console.log("login owner:", await login("demo@faizerp.id", "password123"));

// ---- 2. Temp product with barcode: create -> lookup -> patch -> cleanup ----
const { body: created } = await api("/api/products", {
  method: "POST",
  body: JSON.stringify({
    sku: `BCN-${MARKER}`,
    name: "Uji Barcode Item",
    barcode: MARKER,
    priceSell: 15000,
    priceBuy: 10000,
  }),
});
check("create product with barcode", !!created?.product?.id, created?.product?.barcode ?? "");

const { body: byCode } = await api(`/api/products?barcode=${encodeURIComponent(MARKER)}`);
check("lookup by barcode finds temp product",
  byCode?.products?.length === 1 && byCode.products[0].sku === `BCN-${MARKER}`);

const { body: patched } = await api(`/api/products/${created.product.id}`, {
  method: "PATCH",
  body: JSON.stringify({ barcode: `${MARKER}X` }),
});
check("patch barcode updates field", patched?.product?.barcode === `${MARKER}X`);

const { res: delRes } = await api(`/api/products/${created.product.id}`, { method: "DELETE" });
check("cleanup temp product", delRes.ok);

// ---- 3. Existing demo product has a backfilled barcode & is findable ----
const business = await db.business.findUnique({ where: { slug: "demo-toko-sembako" } });
const demoProduct = await db.product.findFirst({
  where: { businessId: business.id, barcode: { not: null } },
});
const { body: demoLookup } = await api(
  `/api/products?barcode=${encodeURIComponent(demoProduct.barcode)}`,
);
check("backfilled barcode lookup", demoLookup?.products?.[0]?.id === demoProduct.id,
  `${demoProduct.name} -> ${demoProduct.barcode}`);

// ---- 4. Owner dashboard stays the finance variant ----
const { body: ownerStats } = await api("/api/dashboard/stats");
check("owner stats: no role field (owner payload)", !ownerStats?.role);
check("owner stats has cash block", typeof ownerStats?.cash?.net === "number");

// ---- 5. MEMBER dashboard (temp member, own password) ----
const passwordHash = await bcrypt.hash("password123", 10);
const member = await db.user.create({
  data: {
    email: `staff-${Date.now()}@demo.local`,
    name: "Staff Uji",
    passwordHash,
    role: "MEMBER",
    businessId: business.id,
  },
});

console.log("login member:", await login(member.email, "password123"));
const { body: memberStats } = await api("/api/dashboard/stats");
check("member stats role=MEMBER", memberStats?.role === "MEMBER");
check("member cards: operational labels",
  JSON.stringify(memberStats?.stats?.map((s) => s.label)) ===
  JSON.stringify(["Penjualan hari ini", "Pesanan hari ini", "Menunggu aksi", "Stok menipis"]),
  JSON.stringify(memberStats?.stats?.map((s) => s.label)));
check("member payload has NO cash block", memberStats?.cash === undefined);
check("member payload has orders list", Array.isArray(memberStats?.orders));
check("member series is 7 days", memberStats?.salesSeries?.length === 7);

// cleanup temp member
await db.user.delete({ where: { id: member.id } });

console.log(`\n${fail === 0 ? `✓ ALL ${pass} CHECKS PASSED` : `✗ ${fail}/${pass + fail} CHECKS FAILED`}`);
await db.$disconnect();
process.exit(fail === 0 ? 0 : 1);
