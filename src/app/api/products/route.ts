// GET  /api/products  — list products for the current business (?search=)
// POST /api/products  — create a product

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
  const search = url.searchParams.get("search") ?? "";

  const where = {
    businessId,
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { sku: { contains: search } },
          ],
        }
      : {}),
  };

  const products = await db.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      inventory: {
        select: { warehouseId: true, quantity: true },
      },
    },
  });

  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();

  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const sku = String(body.sku ?? "").trim();
    if (!name) return apiError("Nama produk wajib diisi.");
    if (!sku) return apiError("SKU wajib diisi.");

    const existing = await db.product.findUnique({
      where: { businessId_sku: { businessId, sku } },
    });
    if (existing) return apiError("SKU sudah dipakai produk lain.", 409);

    const product = await db.product.create({
      data: {
        businessId,
        name,
        sku,
        category: body.category ? String(body.category) : null,
        brand: body.brand ? String(body.brand) : null,
        unit: body.unit ? String(body.unit) : null,
        priceSell: Number(body.priceSell) || 0,
        priceBuy: Number(body.priceBuy) || 0,
      },
    });

    await db.auditLog.create({
      data: {
        businessId,
        userId: (session.user as unknown as { id?: string }).id ?? null,
        action: "create",
        entity: "Product",
        entityId: product.id,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (e) {
    console.error("POST /api/products", e);
    return apiError("Gagal membuat produk.", 500);
  }
}
