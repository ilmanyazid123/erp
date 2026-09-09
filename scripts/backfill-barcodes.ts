// Backfill: assign an EAN-13 barcode (Indonesian prefix 899) to every
// product that has none. Idempotent — only fills barcode = null.
//
// Run: env -u DATABASE_URL -u DIRECT_URL npx tsx scripts/backfill-barcodes.ts

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Compute the EAN-13 check digit for a 12-digit base.
function ean13(base12: string): string {
  const sum = [...base12].reduce(
    (a, d, i) => a + Number(d) * (i % 2 === 0 ? 1 : 3),
    0,
  );
  return base12 + String((10 - (sum % 10)) % 10);
}

async function main() {
  const businesses = await db.business.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  let total = 0;
  for (let b = 0; b < businesses.length; b++) {
    const biz = businesses[b];
    const products = await db.product.findMany({
      where: { businessId: biz.id, barcode: null },
      orderBy: { createdAt: "asc" },
    });
    for (let s = 0; s < products.length; s++) {
      const base12 =
        "899" + String(b + 1).padStart(4, "0") + String(s + 1).padStart(5, "0");
      await db.product.update({
        where: { id: products[s].id },
        data: { barcode: ean13(base12) },
      });
      total++;
    }
    console.log(`${biz.name}: ${products.length} produk diberi barcode`);
  }
  console.log(`TOTAL: ${total} barcode dibuat`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
