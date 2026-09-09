// PATCH /api/sales-orders/[id] — change order status.
// Status flow: DRAFT -> CONFIRMED -> DELIVERED, or CANCELLED.
// CONFIRMED deducts stock (with a guard); CANCELLED from CONFIRMED restores it.

import { NextResponse } from "next/server";
import { getSession, getCurrentBusinessId } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, apiError } from "@/lib/api-utils";
import { ensureDefaultWarehouse, applyStock, totalStock } from "@/lib/stock";

const ALLOWED: Record<string, string[]> = {
  DRAFT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  INVOICED: [],
  CANCELLED: [],
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();
  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  const { id } = await params;

  try {
    const order = await db.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order || order.businessId !== businessId) {
      return apiError("Pesanan tidak ditemukan.", 404);
    }

    const body = await req.json();
    const nextStatus = String(body.status ?? "");
    if (!ALLOWED[order.status]?.includes(nextStatus)) {
      return apiError(
        `Perubahan status ${order.status} → ${nextStatus} tidak diizinkan.`,
        400,
      );
    }

    const warehouse = await ensureDefaultWarehouse(businessId);

    if (nextStatus === "CONFIRMED") {
      // Guard: make sure stock is sufficient for every line.
      for (const item of order.items) {
        const stock = await totalStock(businessId, item.productId);
        if (stock < item.quantity) {
          const p = await db.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });
          return apiError(
            `Stok tidak cukup untuk ${p?.name ?? "produk"} (tersedia ${stock}).`,
            400,
          );
        }
      }
      for (const item of order.items) {
        await applyStock({
          businessId,
          warehouseId: warehouse.id,
          productId: item.productId,
          delta: -item.quantity,
          type: "OUT",
          reason: `Penjualan ${order.code}`,
          refType: "SalesOrder",
          refId: order.id,
        });
      }
    }

    if (nextStatus === "CANCELLED" && order.status === "CONFIRMED") {
      // Restock previously deducted quantities.
      for (const item of order.items) {
        await applyStock({
          businessId,
          warehouseId: warehouse.id,
          productId: item.productId,
          delta: item.quantity,
          type: "IN",
          reason: `Pembatalan ${order.code}`,
          refType: "SalesOrder",
          refId: order.id,
        });
      }
    }

    const updated = await db.salesOrder.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        customer: { select: { id: true, name: true } },
        items: true,
      },
    });

    await db.auditLog.create({
      data: {
        businessId,
        userId: (session.user as unknown as { id?: string }).id ?? null,
        action: "update",
        entity: "SalesOrder",
        entityId: id,
        metadata: JSON.stringify({ status: nextStatus }),
      },
    });

    return NextResponse.json({ order: updated });
  } catch (e) {
    console.error("PATCH /api/sales-orders/[id]", e);
    return apiError("Gagal memperbarui pesanan penjualan.", 500);
  }
}
