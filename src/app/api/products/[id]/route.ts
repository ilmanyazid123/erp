// PATCH  /api/products/[id] — update a product
// DELETE /api/products/[id] — delete a product

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
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.sku !== undefined) data.sku = String(body.sku).trim();
    if (body.category !== undefined)
      data.category = body.category ? String(body.category) : null;
    if (body.brand !== undefined)
      data.brand = body.brand ? String(body.brand) : null;
    if (body.unit !== undefined)
      data.unit = body.unit ? String(body.unit) : null;
    if (body.priceSell !== undefined) data.priceSell = Number(body.priceSell) || 0;
    if (body.priceBuy !== undefined) data.priceBuy = Number(body.priceBuy) || 0;

    const product = await db.product.update({
      where: { id },
      data,
    });
    // Ensure the product belongs to this business.
    if (product.businessId !== businessId) return unauthorized();

    await db.auditLog.create({
      data: {
        businessId,
        userId: (session.user as unknown as { id?: string }).id ?? null,
        action: "update",
        entity: "Product",
        entityId: product.id,
      },
    });

    return NextResponse.json({ product });
  } catch (e) {
    console.error("PATCH /api/products/[id]", e);
    return apiError("Gagal memperbarui produk.", 500);
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
    const product = await db.product.findUnique({ where: { id } });
    if (!product || product.businessId !== businessId) {
      return apiError("Produk tidak ditemukan.", 404);
    }

    await db.product.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        businessId,
        userId: (session.user as unknown as { id?: string }).id ?? null,
        action: "delete",
        entity: "Product",
        entityId: id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/products/[id]", e);
    return apiError(
      "Gagal menghapus produk (mungkin masih dipakai di transaksi).",
      500,
    );
  }
}
