// PATCH /api/purchase-orders/[id] — change order status.
// Flow: DRAFT -> SUBMITTED -> APPROVED -> RECEIVED, or CANCELLED.
// SUBMITTED creates an Approval request; APPROVED settles it;
// RECEIVED increments stock with IN movements.

import { NextResponse } from "next/server";
import { getSession, getCurrentBusinessId } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, apiError } from "@/lib/api-utils";
import { ensureDefaultWarehouse, applyStock } from "@/lib/stock";

const ALLOWED: Record<string, string[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["APPROVED", "CANCELLED"],
  APPROVED: ["RECEIVED", "CANCELLED"],
  RECEIVED: [],
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
    const order = await db.purchaseOrder.findUnique({
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

    // Approval workflow wiring.
    if (nextStatus === "SUBMITTED") {
      await db.approval.create({
        data: {
          businessId,
          refType: "PurchaseOrder",
          refId: order.id,
          action: "APPROVE",
          status: "PENDING",
          notes: `Persetujuan pembelian ${order.code}`,
          requestedById: ((session.user as unknown as { id?: string }).id ?? null) ?? null,
        },
      });
    }
    if (nextStatus === "APPROVED" || nextStatus === "CANCELLED") {
      // Settle any pending approval for this order.
      await db.approval.updateMany({
        where: {
          businessId,
          refType: "PurchaseOrder",
          refId: order.id,
          status: "PENDING",
        },
        data: {
          status: nextStatus === "APPROVED" ? "APPROVED" : "CANCELLED",
          decidedAt: new Date(),
        },
      });
    }

    if (nextStatus === "RECEIVED") {
      const warehouse = await ensureDefaultWarehouse(businessId);
      for (const item of order.items) {
        await applyStock({
          businessId,
          warehouseId: warehouse.id,
          productId: item.productId,
          delta: item.quantity,
          type: "IN",
          reason: `Pembelian ${order.code}`,
          refType: "PurchaseOrder",
          refId: order.id,
        });
      }
    }

    const updated = await db.purchaseOrder.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        supplier: { select: { id: true, name: true } },
        items: true,
      },
    });

    await db.auditLog.create({
      data: {
        businessId,
        userId: (session.user as unknown as { id?: string }).id ?? null,
        action: nextStatus === "APPROVED" ? "approve" : "update",
        entity: "PurchaseOrder",
        entityId: id,
        metadata: JSON.stringify({ status: nextStatus }),
      },
    });

    return NextResponse.json({ order: updated });
  } catch (e) {
    console.error("PATCH /api/purchase-orders/[id]", e);
    return apiError("Gagal memperbarui pesanan pembelian.", 500);
  }
}
