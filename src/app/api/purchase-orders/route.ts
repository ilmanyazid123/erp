// GET  /api/purchase-orders — list purchase orders (?status=&search=)
// POST /api/purchase-orders — create a purchase order with items (DRAFT)

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

  const orders = await db.purchaseOrder.findMany({
    where: {
      businessId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search } },
              { supplier: { name: { contains: search } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      supplier: { select: { id: true, name: true } },
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
    const supplierId = String(body.supplierId ?? "");
    const items = Array.isArray(body.items) ? body.items : [];
    if (!supplierId) return apiError("Pemasok wajib dipilih.");
    if (items.length === 0) return apiError("Minimal satu item diperlukan.");

    const supplier = await db.supplier.findFirst({
      where: { id: supplierId, businessId },
    });
    if (!supplier) return apiError("Pemasok tidak ditemukan.", 404);

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
          : product.priceBuy;
      if (qty <= 0) return apiError(`Jumlah untuk ${product.name} harus > 0.`);
      const lineTotal = qty * price;
      total += lineTotal;
      rows.push({ productId: product.id, quantity: qty, price, total: lineTotal });
    }

    const count = await db.purchaseOrder.count({ where: { businessId } });
    const date = new Date();
    const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
      date.getDate(),
    ).padStart(2, "0")}`;
    const code = `PO-${stamp}-${String(count + 1).padStart(4, "0")}`;

    const order = await db.purchaseOrder.create({
      data: {
        businessId,
        supplierId,
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
        supplier: { select: { id: true, name: true } },
        items: true,
      },
    });

    await db.auditLog.create({
      data: {
        businessId,
        userId: (session.user as unknown as { id?: string }).id ?? null,
        action: "create",
        entity: "PurchaseOrder",
        entityId: order.id,
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    console.error("POST /api/purchase-orders", e);
    return apiError("Gagal membuat pesanan pembelian.", 500);
  }
}
