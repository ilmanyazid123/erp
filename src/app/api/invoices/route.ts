// GET /api/invoices — list invoices with related party + payments.
// Optional query: ?type=SALES|PURCHASE&status=UNPAID|PARTIAL|PAID

import { NextResponse } from "next/server";
import { getSession, getCurrentBusinessId } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/api-utils";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();
  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");

  const invoices = await db.invoice.findMany({
    where: {
      businessId,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      customer: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
      payments: { select: { id: true, amount: true, method: true, createdAt: true } },
    },
  });

  return NextResponse.json({ invoices });
}
