// Seed the database with demo data so the dashboard shows something when
// a user signs up fresh. Run with: bun run /home/z/my-project/scripts/seed.ts
//
// This script is idempotent — running it again will not duplicate data.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding demo data...");

  const email = "demo@faizerp.id";
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log("✓ Demo user already exists — skipping seed.");
    return;
  }

  // Create demo business + user + branch + warehouse
  const business = await db.business.create({
    data: { name: "Demo Toko Sembako", slug: "demo-toko-sembako" },
  });
  const user = await db.user.create({
    data: {
      email,
      name: "Ilman Demo",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "OWNER",
      businessId: business.id,
    },
  });
  const branch = await db.branch.create({
    data: { businessId: business.id, name: "Toko Utama" },
  });
  const warehouse = await db.warehouse.create({
    data: {
      businessId: business.id,
      branchId: branch.id,
      name: "Gudang Depan",
      code: "WH-01",
    },
  });

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);
  await db.subscription.create({
    data: {
      businessId: business.id,
      plan: "Team",
      status: "TRIAL",
      trialEndsAt,
    },
  });

  // Demo products
  const productSpecs = [
    { sku: "BRS-001", name: "Beras Premium 5kg", category: "Sembako", brand: "Pandawa", unit: "pcs", priceSell: 75000, priceBuy: 68000 },
    { sku: "MNR-002", name: "Minyak Goreng 2L", category: "Sembako", brand: "Bimoli", unit: "pcs", priceSell: 38000, priceBuy: 33000 },
    { sku: "GUL-003", name: "Gula Pasir 1kg", category: "Sembako", brand: "Gulaku", unit: "pcs", priceSell: 18000, priceBuy: 15000 },
    { sku: "KPI-004", name: "Kopi Susu 250ml", category: "Minuman", brand: "Kopiko", unit: "pcs", priceSell: 18000, priceBuy: 14000 },
    { sku: "TEH-005", name: "Teh Manis 350ml", category: "Minuman", brand: "Sosro", unit: "pcs", priceSell: 12000, priceBuy: 9000 },
    { sku: "RTI-006", name: "Roti Coklat", category: "Snack", brand: "Sari Roti", unit: "pcs", priceSell: 9500, priceBuy: 7000 },
    { sku: "AIR-007", name: "Air Mineral 600ml", category: "Minuman", brand: "Aqua", unit: "pcs", priceSell: 5000, priceBuy: 3500 },
    { sku: "SNK-008", name: "Snack Kentang 100g", category: "Snack", brand: "Lays", unit: "pcs", priceSell: 15000, priceBuy: 12000 },
    { sku: "MIE-009", name: "Mie Instan Goreng", category: "Sembako", brand: "Indomie", unit: "pcs", priceSell: 3500, priceBuy: 2800 },
    { sku: "SGT-010", name: "Susu UHT 1L", category: "Minuman", brand: "Ultra", unit: "pcs", priceSell: 22000, priceBuy: 18000 },
  ];
  const products = await Promise.all(
    productSpecs.map((p) =>
      db.product.create({
        data: { ...p, businessId: business.id },
      }),
    ),
  );

  // Set inventory for each product (some low stock)
  const stockLevels = [48, 32, 60, 24, 40, 8, 60, 15, 120, 30];
  await Promise.all(
    products.map((p, i) =>
      db.inventoryItem.create({
        data: {
          businessId: business.id,
          warehouseId: warehouse.id,
          productId: p.id,
          quantity: stockLevels[i],
        },
      }),
    ),
  );

  // Demo customer & supplier
  const customer = await db.customer.create({
    data: {
      businessId: business.id,
      name: "Warung Bu Sari",
      email: "busari@example.com",
      phone: "081234567890",
      address: "Jl. Mawar No. 12, Depok",
    },
  });
  const supplier = await db.supplier.create({
    data: {
      businessId: business.id,
      name: "PT Distributor Sembako Jaya",
      email: "sales@sembakojaya.com",
      phone: "0215551234",
      address: "Jl. Pasar Induk, Jakarta",
    },
  });

  // Generate 30 days of demo sales data
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const salesCount = Math.floor(Math.random() * 5) + 1;
    for (let j = 0; j < salesCount; j++) {
      const items: { productId: string; quantity: number; price: number; total: number }[] = [];
      let total = 0;
      const itemCount = Math.floor(Math.random() * 3) + 1;
      for (let k = 0; k < itemCount; k++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const lineTotal = product.priceSell * qty;
        total += lineTotal;
        items.push({ productId: product.id, quantity: qty, price: product.priceSell, total: lineTotal });
      }
      const code = `SO-${String(1000 + i * 10 + j).padStart(4, "0")}`;
      await db.salesOrder.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          code,
          status: "CONFIRMED",
          total,
          createdAt: day,
          items: { create: items },
        },
      });
      await db.payment.create({
        data: {
          businessId: business.id,
          type: "SALES_RECEIPT",
          amount: total,
          method: Math.random() > 0.5 ? "CASH" : "QRIS",
          createdAt: day,
        },
      });
    }
  }

  // A few pending approvals
  for (let i = 0; i < 5; i++) {
    await db.approval.create({
      data: {
        businessId: business.id,
        refType: "PurchaseOrder",
        refId: `po-demo-${i}`,
        action: "APPROVE",
        status: "PENDING",
        requestedById: user.id,
      },
    });
  }

  await db.auditLog.create({
    data: {
      businessId: business.id,
      userId: user.id,
      action: "REGISTER",
      entity: "User",
      entityId: user.id,
      metadata: JSON.stringify({ businessName: business.name, email: user.email }),
    },
  });

  console.log(`✓ Created demo business: ${business.name} (slug: ${business.slug})`);
  console.log(`✓ Created demo user: ${user.email} (password: password123)`);
  console.log(`✓ Created ${products.length} products, 1 customer, 1 supplier`);
  console.log(`✓ Generated 30 days of sales history + 5 pending approvals`);
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
