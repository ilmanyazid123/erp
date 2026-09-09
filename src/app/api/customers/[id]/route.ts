// PATCH  /api/customers/[id]
// DELETE /api/customers/[id]

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
    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing || existing.businessId !== businessId) {
      return apiError("Pelanggan tidak ditemukan.", 404);
    }

    const body = await req.json();
    const customer = await db.customer.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.email !== undefined
          ? { email: body.email ? String(body.email) : null }
          : {}),
        ...(body.phone !== undefined
          ? { phone: body.phone ? String(body.phone) : null }
          : {}),
        ...(body.address !== undefined
          ? { address: body.address ? String(body.address) : null }
          : {}),
      },
    });

    await db.auditLog.create({
      data: {
        businessId,
        userId: (session.user as unknown as { id?: string }).id ?? null,
        action: "update",
        entity: "Customer",
        entityId: id,
      },
    });

    return NextResponse.json({ customer });
  } catch (e) {
    console.error("PATCH /api/customers/[id]", e);
    return apiError("Gagal memperbarui pelanggan.", 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();
  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  const { id } = await params;

  try {
    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing || existing.businessId !== businessId) {
      return apiError("Pelanggan tidak ditemukan.", 404);
    }

    await db.customer.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        businessId,
        userId: (session.user as unknown as { id?: string }).id ?? null,
        action: "delete",
        entity: "Customer",
        entityId: id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/customers/[id]", e);
    return apiError("Gagal menghapus pelanggan (mungkin punya transaksi).", 500);
  }
}
