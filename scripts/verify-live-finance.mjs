// Verify the live deployment serves the new Finance sync API.
// Run: node scripts/verify-live-finance.mjs

const BASE = "https://erp-puce-two.vercel.app";
let jar = {};

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

const t0 = Date.now();
const { body: csrfBody } = await api("/api/auth/csrf");
const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
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
cookies(res);
console.log("login:", res.status);

const { body: pay } = await api("/api/payments");
console.log("payments API:", res?.status ?? "-");
console.log("  totals:", JSON.stringify(pay.totals));
console.log("  series days:", pay.series?.length, "| first:", JSON.stringify(pay.series?.[0]), "| last:", JSON.stringify(pay.series?.at(-1)));
console.log("  recent payment sample:", JSON.stringify(pay.payments?.[0]?.invoice ?? null));

const { body: inv } = await api("/api/invoices");
console.log("invoices:", inv.invoices?.length, "| with refCode:", inv.invoices?.filter((i) => i.refCode).length);
const sample = inv.invoices?.find((i) => i.refCode);
console.log("  sample:", sample ? `${sample.code} <- ${sample.refCode} (${sample.type}, ${sample.status})` : "none");

const ok = pay.totals && pay.series?.length === 30 && inv.invoices?.length > 0;
console.log(`\n${ok ? "✓ LIVE VERIFIED" : "✗ LIVE CHECK FAILED"} (${Date.now() - t0}ms)`);
process.exit(ok ? 0 : 1);
