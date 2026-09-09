// GET  /api/team — list users of the current business (owner + staff).
// POST /api/team — owner adds a staff account (max 5 staff per toko).

import { NextResponse } from "next/server";
import { getSessionUser, isOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, apiError } from "@/lib/api-utils";

// Platform limit: an owner can have at most 5 staff accounts ("user 1-5").
const MAX_STAFF_PER_BUSINESS = 5;

export async function GET() {
  const user = await getSessionUser();
  if (!user?.businessId) return unauthorized();

  const users = await db.user.findMany({
    where: { businessId: user.businessId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const staffCount = users.filter((u) => u.role === "MEMBER").length;
  return NextResponse.json({ users, staffCount, maxStaff: MAX_STAFF_PER_BUSINESS });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user?.businessId) return unauthorized();
  if (!isOwner(user)) {
    return apiError("Hanya pemilik toko yang dapat menambah pengguna.", 403);
  }

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").toLowerCase().trim();
    const password = String(body.password ?? "");

    if (!name || !email || !password) {
      return apiError("Nama, email, dan password wajib diisi.");
    }
    if (password.length < 6) {
      return apiError("Password minimal 6 karakter.");
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return apiError("Format email tidak valid.");
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return apiError("Email sudah terdaftar. Gunakan email lain.", 409);
    }

    const staffCount = await db.user.count({
      where: { businessId: user.businessId, role: "MEMBER" },
    });
    if (staffCount >= MAX_STAFF_PER_BUSINESS) {
      return apiError(
        `Kuota staff penuh (maksimal ${MAX_STAFF_PER_BUSINESS} staf per toko). Hapus staf lama terlebih dahulu.`,
      );
    }

    const bcrypt = await import("bcryptjs");
    const staff = await db.user.create({
      data: {
        email,
        name,
        passwordHash: await bcrypt.hash(password, 10),
        role: "MEMBER",
        businessId: user.businessId,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await db.auditLog.create({
      data: {
        businessId: user.businessId,
        userId: user.id,
        action: "create",
        entity: "User",
        entityId: staff.id,
        metadata: JSON.stringify({ email: staff.email, role: "MEMBER" }),
      },
    });

    return NextResponse.json({ user: staff }, { status: 201 });
  } catch (e) {
    console.error("POST /api/team", e);
    return apiError("Gagal menambah pengguna.", 500);
  }
}
