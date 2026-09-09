// Shared stock helpers for order APIs.
import { db } from "@/lib/db";

// Returns the first warehouse of the business, creating a default one
// (plus a default branch) when none exists yet.
export async function ensureDefaultWarehouse(businessId: string) {
  const existing = await db.warehouse.findFirst({
    where: { businessId },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  const branch =
    (await db.branch.findFirst({ where: { businessId } })) ??
    (await db.branch.create({
      data: { businessId, name: "Kantor Pusat" },
    }));

  return db.warehouse.create({
    data: { businessId, branchId: branch.id, name: "Gudang Utama", code: "WH-01" },
  });
}

// Upserts the inventory balance for (warehouseId, productId) by applying a
// signed delta and records a StockMovement row. `type` is one of
// IN / OUT / ADJUSTMENT / TRANSFER.
export async function applyStock(opts: {
  businessId: string;
  warehouseId: string;
  productId: string;
  delta: number; // positive = stock in, negative = stock out
  type: "IN" | "OUT" | "ADJUSTMENT" | "TRANSFER";
  reason?: string;
  refType?: string;
  refId?: string;
}) {
  const { warehouseId, productId, delta } = opts;

  const item = await db.inventoryItem.findUnique({
    where: { warehouseId_productId: { warehouseId, productId } },
  });

  if (item) {
    await db.inventoryItem.update({
      where: { id: item.id },
      data: { quantity: { increment: delta } },
    });
  } else {
    await db.inventoryItem.create({
      data: { businessId: opts.businessId, warehouseId, productId, quantity: delta },
    });
  }

  await db.stockMovement.create({
    data: {
      warehouseId,
      productId,
      type: opts.type,
      quantity: Math.abs(delta),
      reason: opts.reason,
      refType: opts.refType,
      refId: opts.refId,
    },
  });
}

// Current stock for a product across all warehouses of the business.
export async function totalStock(businessId: string, productId: string) {
  const rows = await db.inventoryItem.findMany({
    where: { productId, warehouse: { businessId } },
    select: { quantity: true },
  });
  return rows.reduce((acc, r) => acc + r.quantity, 0);
}
