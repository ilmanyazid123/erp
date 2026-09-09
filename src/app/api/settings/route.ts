// GET   /api/settings — business profile + subscription
// PATCH /api/settings — update business profile (name, address placeholder)

import { NextResponse } from "next/server";
import { getSession, getCurrentBusinessId, getSessionUser, isOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, apiError } from "@/lib/api-utils";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();
  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  const business = await db.business.findUnique({
    where: { id: businessId },
    include: {
      subscription: true,
      _count: {
        select: {
          users: true,
          products: true,
          customers: true,
          suppliers: true,
          warehouses: true,
        },
      },
    },
  });
  if (!business) return apiError("Bisnis tidak ditemukan.", 404);

  const { _count, subscription, ...rest } = business;
  return NextResponse.json({ business: rest, subscription, counts: _count });
}

export async function PATCH(req: Request) {
  const actor = await getSessionUser();
  if (!actor?.businessId) return unauthorized();
  if (!isOwner(actor)) {
    return apiError("Hanya pemilik toko yang dapat mengubah pengaturan.", 403);
  }
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();
  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return apiError("Nama bisnis tidak boleh kosong.");
      data.name = name;
    }

    const business = await db.business.update({
      where: { id: businessId },
      data,
    });

    await db.auditLog.create({
      data: {
        businessId,
        userId: (session.user as unknown as { id?: string }).id ?? null,
        action: "update",
        entity: "Business",
        entityId: businessId,
      },
    });

    return NextResponse.json({ business });
  } catch (e) {
    console.error("PATCH /api/settings", e);
    return apiError("Gagal menyimpan pengaturan.", 500);
  }
}
