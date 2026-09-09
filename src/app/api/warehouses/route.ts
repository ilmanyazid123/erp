// GET /api/warehouses — list warehouses (with branch names) of the business.

import { NextResponse } from "next/server";
import { getSession, getCurrentBusinessId } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/api-utils";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();
  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  const warehouses = await db.warehouse.findMany({
    where: { businessId },
    orderBy: { createdAt: "asc" },
    include: {
      branch: { select: { id: true, name: true } },
      inventory: { select: { quantity: true } },
    },
  });

  return NextResponse.json({ warehouses });
}
