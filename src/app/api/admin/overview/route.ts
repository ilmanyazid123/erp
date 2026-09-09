// GET /api/admin/overview — platform-wide stats + business list.
// ADMIN only (the website administrator). Business users get 403.

import { NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, apiError } from "@/lib/api-utils";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (!isAdmin(user)) {
    return apiError("Hanya administrator yang dapat mengakses data ini.", 403);
  }

  const [
    businessCount,
    userCount,
    staffCount,
    productCount,
    salesOrderCount,
    purchaseOrderCount,
    salesAgg,
    paymentAgg,
    businesses,
  ] = await Promise.all([
    db.business.count(),
    db.user.count({ where: { role: "OWNER" } }),
    db.user.count({ where: { role: "MEMBER" } }),
    db.product.count(),
    db.salesOrder.count(),
    db.purchaseOrder.count(),
    db.salesOrder.aggregate({ _sum: { total: true } }),
    db.payment.aggregate({ _sum: { amount: true } }),
    db.business.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        },
        products: { select: { id: true } },
        sales: { select: { id: true, total: true } },
        subscription: { select: { plan: true, status: true } },
      },
    }),
  ]);

  const list = businesses.map((b) => {
    const owner = b.users.find((u) => u.role === "OWNER");
    const staff = b.users.filter((u) => u.role === "MEMBER");
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      createdAt: b.createdAt,
      owner: owner ? { name: owner.name, email: owner.email } : null,
      staffCount: staff.length,
      staff: staff.map((s) => ({ name: s.name, email: s.email })),
      productCount: b.products.length,
      salesOrderCount: b.sales.length,
      salesTotal: b.sales.reduce((a, o) => a + o.total, 0),
      plan: b.subscription?.plan ?? null,
      planStatus: b.subscription?.status ?? null,
    };
  });

  return NextResponse.json({
    stats: {
      businessCount,
      ownerCount: userCount,
      staffCount,
      productCount,
      salesOrderCount,
      purchaseOrderCount,
      salesTotal: salesAgg._sum.total ?? 0,
      paymentTotal: paymentAgg._sum.amount ?? 0,
    },
    businesses: list,
  });
}
