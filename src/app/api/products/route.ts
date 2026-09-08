// GET /api/products
// Returns products for the current business. Optional query: ?search=

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/api-utils";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();

  // @ts-expect-error - augmented field on session.user
  const businessId = session.user.businessId;
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
