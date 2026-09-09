// PATCH /api/approvals/[id] — decide an approval (APPROVED / REJECTED).
// If the approval targets a PurchaseOrder in SUBMITTED status, the order
// status is advanced accordingly.

import { NextResponse } from "next/server";
import { getSession, getCurrentBusinessId } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, apiError } from "@/lib/api-utils";

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
    const approval = await db.approval.findUnique({ where: { id } });
    if (!approval || approval.businessId !== businessId) {
      return apiError("Persetujuan tidak ditemukan.", 404);
    }
    if (approval.status !== "PENDING") {
      return apiError("Persetujuan ini sudah diputuskan.");
    }

    const body = await req.json();
    const decision = String(body.decision ?? "").toUpperCase();
    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return apiError("Keputusan harus APPROVED atau REJECTED.");
    }

    const updated = await db.approval.update({
      where: { id },
      data: { status: decision, decidedAt: new Date() },
    });

    // Cascade to the referenced purchase order when applicable.
    if (approval.refType === "PurchaseOrder") {
      const order = await db.purchaseOrder.findUnique({
        where: { id: approval.refId },
      });
      if (order && order.businessId === businessId && order.status === "SUBMITTED") {
        await db.purchaseOrder.update({
          where: { id: order.id },
          data: { status: decision === "APPROVED" ? "APPROVED" : "CANCELLED" },
        });
      }
    }

    await db.auditLog.create({
      data: {
        businessId,
        userId: (session.user as unknown as { id?: string }).id ?? null,
        action: decision === "APPROVED" ? "approve" : "reject",
        entity: "Approval",
        entityId: id,
      },
    });

    return NextResponse.json({ approval: updated });
  } catch (e) {
    console.error("PATCH /api/approvals/[id]", e);
    return apiError("Gagal memutus persetujuan.", 500);
  }
}
