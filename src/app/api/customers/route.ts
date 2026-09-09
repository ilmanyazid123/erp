// GET  /api/customers — list customers (?search=)
// POST /api/customers — create customer

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

  const customers = await db.customer.findMany({
    where: {
      businessId,
      ...(search ? { name: { contains: search } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ customers });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();
  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) return apiError("Nama pelanggan wajib diisi.");

    const customer = await db.customer.create({
      data: {
        businessId,
        name,
        email: body.email ? String(body.email) : null,
        phone: body.phone ? String(body.phone) : null,
        address: body.address ? String(body.address) : null,
      },
    });

    await db.auditLog.create({
      data: {
        businessId,
        userId: (session.user as unknown as { id?: string }).id ?? null,
        action: "create",
        entity: "Customer",
        entityId: customer.id,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (e) {
    console.error("POST /api/customers", e);
    return apiError("Gagal membuat pelanggan.", 500);
  }
}
