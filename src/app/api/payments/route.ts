// GET  /api/payments — recent payments
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

  const payments = await db.payment.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      invoice: { select: { id: true, code: true, type: true } },
    },
  });

  return NextResponse.json({ payments });
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
