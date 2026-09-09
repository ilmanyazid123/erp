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

  // Resolve the source order codes (SO-... / PO-...) for the invoices.
  const soIds = invoices
    .filter((i) => i.refType === "SalesOrder" && i.refId)
    .map((i) => i.refId as string);
  const poIds = invoices
    .filter((i) => i.refType === "PurchaseOrder" && i.refId)
    .map((i) => i.refId as string);
  const [sos, pos] = await Promise.all([
    soIds.length
      ? db.salesOrder.findMany({ where: { id: { in: soIds } }, select: { id: true, code: true } })
      : Promise.resolve([]),
    poIds.length
      ? db.purchaseOrder.findMany({ where: { id: { in: poIds } }, select: { id: true, code: true } })
      : Promise.resolve([]),
  ]);
  const refCodeMap = new Map<string, string>();
  for (const o of sos) refCodeMap.set(o.id, o.code);
  for (const o of pos) refCodeMap.set(o.id, o.code);

  return NextResponse.json({
    invoices: invoices.map((i) => ({
      ...i,
      refCode: i.refId ? (refCodeMap.get(i.refId) ?? null) : null,
    })),
  });
}
