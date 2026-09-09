// DELETE /api/team/[id] — owner removes a staff account (MEMBER only).

import { NextResponse } from "next/server";
import { getSessionUser, isOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, apiError } from "@/lib/api-utils";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user?.businessId) return unauthorized();
  if (!isOwner(user)) {
    return apiError("Hanya pemilik toko yang dapat menghapus pengguna.", 403);
  }

  const { id } = await params;

  const target = await db.user.findUnique({ where: { id } });
  if (!target || target.businessId !== user.businessId) {
    return apiError("Pengguna tidak ditemukan.", 404);
  }
  if (target.role !== "MEMBER") {
    return apiError("Hanya akun staf yang dapat dihapus.", 400);
  }

  await db.user.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      businessId: user.businessId,
      userId: user.id,
      action: "delete",
      entity: "User",
      entityId: id,
      metadata: JSON.stringify({ email: target.email }),
    },
  });

  return NextResponse.json({ ok: true });
}
