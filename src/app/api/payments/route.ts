// GET /api/payments — recent payments + cash-flow totals and a 30-day series.
// POST /api/payments — record a payment against an invoice and update its status.

import { NextResponse } from "next/server";
import { getSession, getCurrentBusinessId } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, apiError } from "@/lib/api-utils";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();
  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  const [payments, totals, recent30] = await Promise.all([
    db.payment.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        invoice: { select: { id: true, code: true, type: true } },
      },
    }),
    // All-time money in / out for the Finance cash-flow cards.
    db.payment.groupBy({
      by: ["type"],
      where: { businessId },
      _sum: { amount: true },
    }),
    // Last 30 days of payments for the cash-flow chart.
    db.payment.findMany({
      where: {
        businessId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { amount: true, type: true, createdAt: true },
    }),
  ]);

  const totalIn = totals.find((t) => t.type === "SALES_RECEIPT")?._sum.amount ?? 0;
  const totalOut = totals.find((t) => t.type === "PURCHASE_DISBURSEMENT")?._sum.amount ?? 0;

  // Build the 30-day in/out buckets (oldest first).
  const today = new Date();
  const buckets = new Map<string, { in: number; out: number }>();
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push(key);
    buckets.set(key, { in: 0, out: 0 });
  }
  for (const p of recent30) {
    const key = p.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (p.type === "SALES_RECEIPT") bucket.in += p.amount;
    else bucket.out += p.amount;
  }

  return NextResponse.json({
    payments,
    totals: {
      in: totalIn,
      out: totalOut,
      net: totalIn - totalOut,
    },
    series: days.map((date) => ({
      date: date.slice(5, 10), // MM-DD
      in: buckets.get(date)!.in,
      out: buckets.get(date)!.out,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();
  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  try {
    const body = await req.json();
    const invoiceId = String(body.invoiceId ?? "");
    const amount = Number(body.amount);
    if (!invoiceId) return apiError("Invoice wajib dipilih.");
    if (!amount || amount <= 0) return apiError("Jumlah pembayaran harus > 0.");

    const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.businessId !== businessId) {
      return apiError("Invoice tidak ditemukan.", 404);
    }
    if (invoice.status === "PAID") return apiError("Invoice sudah lunas.");
    if (invoice.status === "CANCELLED")
      return apiError("Invoice sudah dibatalkan.");

    const remaining = invoice.amount - invoice.paidAmount;
    if (amount > remaining + 0.001) {
      return apiError(
        `Jumlah melebihi sisa tagihan (sisa Rp ${remaining.toLocaleString("id-ID")}).`,
      );
    }

    const payment = await db.payment.create({
      data: {
        businessId,
        invoiceId,
        type: invoice.type === "SALES" ? "SALES_RECEIPT" : "PURCHASE_DISBURSEMENT",
        amount,
        method: body.method ? String(body.method) : null,
        notes: body.notes ? String(body.notes) : null,
      },
    });

    const paidAmount = invoice.paidAmount + amount;
    const status =
      paidAmount >= invoice.amount - 0.001
        ? "PAID"
        : paidAmount > 0
          ? "PARTIAL"
          : "UNPAID";

    await db.invoice.update({
      where: { id: invoiceId },
      data: { paidAmount, status },
    });

    await db.auditLog.create({
      data: {
        businessId,
        userId: (session.user as unknown as { id?: string }).id ?? null,
        action: "payment",
        entity: "Invoice",
        entityId: invoiceId,
        metadata: JSON.stringify({ amount, method: payment.method }),
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (e) {
    console.error("POST /api/payments", e);
    return apiError("Gagal mencatat pembayaran.", 500);
  }
}
