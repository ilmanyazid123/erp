// E2E test: role hierarchy (ADMIN / OWNER / MEMBER staff) + data export.
//
//  1. Admin login -> /api/admin/overview (platform stats + businesses)
//  2. Admin export businesses xlsx/csv -> 200 with correct mime
//  3. Owner adds staff x5 -> 6th rejected (quota)
//  4. Staff login -> operational API OK, finance/settings/export blocked
//  5. Owner export sales/products xlsx + csv -> 200
//  6. Owner deletes staff -> login fails afterwards
//  7. Cleanup
//
// Run: env -u DATABASE_URL -u DIRECT_URL node scripts/e2e-users-export.mjs
// (server on localhost:3000)

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const STAFF_PREFIX = "e2e-staff-";

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

function newJar() {
  jar = {};
}

async function login(email, password) {
  newJar();
  const { body } = await api("/api/auth/csrf");
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; "),
    },
    body: new URLSearchParams({
      csrfToken: body.csrfToken,
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

async function main() {
  const business = await db.business.findFirst({ where: { slug: "demo-toko-sembako" } });

  // ---------- 1. ADMIN
  console.log("— Administrator");
  check("admin login", (await login("admin@faizerp.id", "admin123456")) === 200);
  const ov = await api("/api/admin/overview");
  check("admin overview 200", ov.res.status === 200);
  check(
    "overview lists businesses",
    ov.body.businesses?.length >= 2 && ov.body.stats?.businessCount >= 2,
    `(${ov.body.businesses?.length} toko)`,
  );
  check(
    "business rows carry owner + staff info",
    ov.body.businesses?.every((b) => "owner" in b && "staffCount" in b && "salesTotal" in b),
  );
  const adminBiz = await api("/api/payments");
  check("admin blocked from business APIs", adminBiz.res.status === 401, `(HTTP ${adminBiz.res.status})`);

  // ---------- 2. ADMIN export
  const xlsxRes = await fetch(`${BASE}/api/export/businesses?format=xlsx`, {
    headers: { Cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ") },
  });
  check(
    "admin export businesses xlsx",
    xlsxRes.status === 200 &&
      xlsxRes.headers.get("content-type").includes("spreadsheetml"),
    `(${xlsxRes.status})`,
  );
  const csvRes = await fetch(`${BASE}/api/export/businesses?format=csv`, {
    headers: { Cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ") },
  });
  const csvText = await csvRes.text();
  check(
    "admin export businesses csv",
    csvRes.status === 200 && csvText.includes("Nama Toko") && csvText.includes("Demo Toko Sembako"),
    `(${csvRes.status})`,
  );

  // ---------- 3. OWNER adds staff
  console.log("— Owner kelola staff");
  check("owner login", (await login("demo@faizerp.id", "password123")) === 200);
  const staffIds = [];
  for (let i = 1; i <= 5; i++) {
    const r = await api("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Staff Uji ${i}`,
        email: `${STAFF_PREFIX}${i}@test.local`,
        password: "staff123456",
      }),
    });
    if (r.res.status === 201) staffIds.push(r.body.user.id);
    else check(`add staff ${i}`, false, `(HTTP ${r.res.status}: ${r.body.error})`);
  }
  check("5 staff added", staffIds.length === 5);
  const sixth = await api("/api/team", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Staff Keenam",
      email: `${STAFF_PREFIX}6@test.local`,
      password: "staff123456",
    }),
  });
  check("6th staff rejected (quota 5)", sixth.res.status === 400, `(${sixth.body.error ?? sixth.res.status})`);
  const teamList = await api("/api/team");
  check("team GET returns quota", teamList.body.staffCount === 5 && teamList.body.maxStaff === 5);

  // ---------- 4. STAFF permissions
  console.log("— Staff (jaga toko)");
  check("staff login", (await login(`${STAFF_PREFIX}1@test.local`, "staff123456")) === 200);
  const stProducts = await api("/api/products");
  check("staff can access operational data", stProducts.res.status === 200);
  const stFinance = await api("/api/payments");
  check("staff blocked from finance", stFinance.res.status === 403, `(HTTP ${stFinance.res.status})`);
  const stInvoices = await api("/api/invoices");
  check("staff blocked from invoices", stInvoices.res.status === 403);
  const stExport = await api("/api/export/sales");
  check("staff blocked from export", stExport.res.status === 403);
  const stTeamAdd = await api("/api/team", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "X", email: "x@test.local", password: "123456" }),
  });
  check("staff cannot add users", stTeamAdd.res.status === 403);

  // ---------- 5. OWNER export
  console.log("— Owner ekspor data");
  check("owner login", (await login("demo@faizerp.id", "password123")) === 200);
  for (const [entity, format, mime] of [
    ["sales", "xlsx", "spreadsheetml"],
    ["payments", "csv", "text/csv"],
    ["products", "xlsx", "spreadsheetml"],
    ["inventory", "csv", "text/csv"],
  ]) {
    const r = await fetch(`${BASE}/api/export/${entity}?format=${format}`, {
      headers: { Cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ") },
    });
    const ok = r.status === 200 && r.headers.get("content-type").includes(mime);
    check(`owner export ${entity} (${format})`, ok, `(HTTP ${r.status})`);
  }

  // ---------- 6. Owner deletes one staff; deleted staff can't login
  const del = await api(`/api/team/${staffIds[0]}`, { method: "DELETE" });
  check("owner deletes staff", del.res.status === 200);
  const relogin = await login(`${STAFF_PREFIX}1@test.local`, "staff123456");
  // NextAuth returns 401 on failed authorize
  check("deleted staff cannot login", relogin !== 200, `(HTTP ${relogin})`);

  // ---------- cleanup
  console.log("— Cleanup");
  for (const id of staffIds.slice(1)) {
    await db.user.delete({ where: { id } }).catch(() => {});
  }
  await db.auditLog.deleteMany({ where: { entity: "User", entityId: { in: staffIds } } });
  const left = await db.user.count({ where: { email: { contains: STAFF_PREFIX } } });
  check("no test staff left", left === 0, `(${left})`);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main()
  .catch((e) => {
    console.error("E2E error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
