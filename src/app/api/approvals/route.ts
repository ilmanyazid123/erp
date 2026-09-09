// GET  /api/approvals — list approval requests (?status=PENDING)
// POST /api/approvals — create a manual approval request

import { NextResponse } from "next/server";
import { getSession, getCurrentBusinessId } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, apiError } from "@/lib/api-utils";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();
  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const approvals = await db.approval.findMany({
    where: { businessId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      requestedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ approvals });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();
  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  try {
    const body = await req.json();
    const refType = String(body.refType ?? "MANUAL");
    const refId = String(body.refId ?? `manual-${Date.now()}`);
    const action = String(body.action ?? "APPROVE");

    const approval = await db.approval.create({
      data: {
        businessId,
        refType,
        refId,
        action,
        status: "PENDING",
        notes: body.notes ? String(body.notes) : null,
        requestedById: ((session.user as unknown as { id?: string }).id ?? null) ?? null,
      },
    });

    return NextResponse.json({ approval }, { status: 201 });
  } catch (e) {
    console.error("POST /api/approvals", e);
    return apiError("Gagal membuat permintaan persetujuan.", 500);
  }
}
