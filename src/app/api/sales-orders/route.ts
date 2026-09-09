// GET  /api/sales-orders — list sales orders (?status=&search=)
// POST /api/sales-orders — create a sales order with items (DRAFT)

import { NextResponse } from "next/server";
import { getSession, getCurrentBusinessId } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, apiError } from "@/lib/api-utils";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();
  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search") ?? "";

  const orders = await db.salesOrder.findMany({
    where: {
      businessId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search } },
              { customer: { name: { contains: search } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      customer: { select: { id: true, name: true } },
      items: {
        include: { product: { select: { id: true, name: true, unit: true } } },
      },
    },
  });

  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();
  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  try {
    const body = await req.json();
    const customerId = String(body.customerId ?? "");
    const items = Array.isArray(body.items) ? body.items : [];
    if (!customerId) return apiError("Pelanggan wajib dipilih.");
    if (items.length === 0) return apiError("Minimal satu item diperlukan.");

    // Validate customer belongs to this business.
    const customer = await db.customer.findFirst({
      where: { id: customerId, businessId },
    });
    if (!customer) return apiError("Pelanggan tidak ditemukan.", 404);

    // Validate products and compute totals.
    const productIds = items.map((i: { productId: string }) => String(i.productId));
    const products = await db.product.findMany({
      where: { businessId, id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let total = 0;
    const rows: Array<{ productId: string; quantity: number; price: number; total: number }> = [];
    for (const item of items) {
      const product = productMap.get(String(item.productId));
      if (!product) return apiError("Produk tidak ditemukan.", 404);
      const qty = Number(item.quantity) || 0;
      const price =
        item.price !== undefined && item.price !== null && item.price !== ""
          ? Number(item.price)
          : product.priceSell;
      if (qty <= 0) return apiError(`Jumlah untuk ${product.name} harus > 0.`);
      const lineTotal = qty * price;
      total += lineTotal;
      rows.push({ productId: product.id, quantity: qty, price, total: lineTotal });
    }

    // Generate the next order code, e.g. SO-20260909-0001
    const count = await db.salesOrder.count({ where: { businessId } });
    const date = new Date();
    const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
      date.getDate(),
    ).padStart(2, "0")}`;
    const code = `SO-${stamp}-${String(count + 1).padStart(4, "0")}`;

    const order = await db.salesOrder.create({
      data: {
        businessId,
        customerId,
        code,
        status: "DRAFT",
        total,
        notes: body.notes ? String(body.notes) : null,
        items: {
          create: rows.map((r) => ({
            productId: r.productId,
            quantity: r.quantity,
            price: r.price,
            total: r.total,
          })),
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
        items: true,
      },
    });

    await db.auditLog.create({
      data: {
        businessId,
        userId: (session.user as unknown as { id?: string }).id ?? null,
        action: "create",
        entity: "SalesOrder",
        entityId: order.id,
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    console.error("POST /api/sales-orders", e);
    return apiError("Gagal membuat pesanan penjualan.", 500);
  }
}
