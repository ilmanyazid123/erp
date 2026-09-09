// Seed the platform administrator account (role ADMIN, no business).
// ADMIN manages the website: sees every toko in /admin, can export the
// business directory. Idempotent — safe to re-run.
//
// Run with: env -u DATABASE_URL -u DIRECT_URL npx tsx scripts/seed-admin.ts

import "dotenv/config";
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

const EMAIL = "admin@faizerp.id";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123456";

async function main() {
  console.log("👑 Seeding platform administrator...");

  const existing = await db.user.findUnique({ where: { email: EMAIL } });
  if (existing) {
    if (existing.role !== "ADMIN") {
      await db.user.update({ where: { email: EMAIL }, data: { role: "ADMIN" } });
      console.log(`✓ ${EMAIL} sudah ada — role dinaikkan ke ADMIN.`);
    } else {
      console.log(`✓ Administrator ${EMAIL} sudah ada — skip.`);
    }
    return;
  }

  const admin = await db.user.create({
    data: {
      email: EMAIL,
      name: "Administrator",
      passwordHash: await bcrypt.hash(PASSWORD, 10),
      role: "ADMIN",
      businessId: null,
    },
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "SEED_ADMIN",
      entity: "User",
      entityId: admin.id,
      metadata: JSON.stringify({ email: EMAIL, role: "ADMIN" }),
    },
  });

  console.log(`✓ Administrator dibuat: ${EMAIL} (password: ${PASSWORD})`);
  console.log("  ⚠️ Ganti password ini setelah login pertama.");
}

main()
  .catch((err) => {
    console.error("Seed admin error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
