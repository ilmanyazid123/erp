// POST /api/auth/register
// Body: { businessName, name, email, password, confirmPassword }
// Creates a new Business (workspace), the first Owner User, default Branch
// + Warehouse, and a 30-day trial Subscription.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function makeSlugUnique(base: string): string {
  // Append a short random suffix to avoid collisions.
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const businessName = String(body.businessName ?? "").trim();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").toLowerCase().trim();
    const password = String(body.password ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    // Validation
    if (!businessName || !name || !email || !password) {
      return NextResponse.json(
        { error: "Semua field wajib diisi." },
        { status: 400 },
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter." },
        { status: 400 },
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Konfirmasi password tidak cocok." },
        { status: 400 },
      );
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid." },
        { status: 400 },
      );
    }

    // Check if email is already taken
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan login." },
        { status: 409 },
      );
    }

    // Generate a unique slug for the business
    const baseSlug = slugify(businessName) || "workspace";
    let slug = baseSlug;
    let attempt = 0;
    while (await db.business.findUnique({ where: { slug } })) {
      attempt += 1;
      slug = makeSlugUnique(baseSlug);
      if (attempt > 5) break;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create business + user + default branch/warehouse + trial subscription
    // in a single transaction.
    const result = await db.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: { name: businessName, slug },
      });

      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: "OWNER",
          businessId: business.id,
        },
      });

      const branch = await tx.branch.create({
        data: {
          businessId: business.id,
          name: "Kantor Pusat",
          address: null,
        },
      });

      await tx.warehouse.create({
        data: {
          businessId: business.id,
          branchId: branch.id,
          name: "Gudang Utama",
          code: "WH-01",
        },
      });

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);
      await tx.subscription.create({
        data: {
          businessId: business.id,
          plan: "Starter",
          status: "TRIAL",
          trialEndsAt,
        },
      });

      await tx.auditLog.create({
        data: {
          businessId: business.id,
          userId: user.id,
          action: "REGISTER",
          entity: "User",
          entityId: user.id,
          metadata: JSON.stringify({ businessName, email }),
        },
      });

      return { user, business };
    });

    return NextResponse.json(
      {
        ok: true,
        user: { id: result.user.id, email: result.user.email, name: result.user.name },
        business: { id: result.business.id, name: result.business.name, slug: result.business.slug },
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("[register] error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 },
    );
  }
}
