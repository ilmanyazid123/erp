// GET /api/activities
// Recent activity feed for the dashboard mockup.

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/api-utils";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();

  // @ts-expect-error - augmented field on session.user
  const businessId = session.user.businessId;
  if (!businessId) return unauthorized();

  // Pull the 10 most recent audit logs for the business.
  const logs = await db.auditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      user: { select: { name: true } },
    },
  });

  const activities = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    createdAt: log.createdAt.toISOString(),
    userName: log.user?.name ?? "Sistem",
    // Human-friendly description
    label: describeActivity(log.action, log.entity),
    tone: toneForActivity(log.action),
    timeAgo: timeAgo(log.createdAt),
  }));

  return NextResponse.json({ activities });
}

function describeActivity(action: string | null, entity: string | null): string {
  if (!action) return "Aktivitas tercatat";
  const a = action.toLowerCase();
  if (a === "register") return "Bisnis terdaftar";
  if (a === "create") return `Membuat ${entity ?? "entitas"}`;
  if (a === "approve") return "Persetujuan diberikan";
  if (a === "reject") return "Permintaan ditolak";
  if (a === "payment") return "Pembayaran diterima";
  return `${action}${entity ? ` pada ${entity}` : ""}`;
}

function toneForActivity(action: string): "primary" | "teal" | "coral" {
  const a = action.toLowerCase();
  if (a.includes("approve") || a.includes("create") || a.includes("register")) return "primary";
  if (a.includes("payment")) return "teal";
  if (a.includes("reject") || a.includes("cancel")) return "coral";
  return "primary";
}

function timeAgo(d: Date): string {
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
