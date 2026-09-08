// GET /api/me
// Returns the authenticated user's profile + business + subscription.

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/api-utils";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();

  // @ts-expect-error - augmented field on session.user
  const businessId = session.user.businessId ?? null;

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      businessId: true,
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!user) return unauthorized();

  let subscription: { plan: string; status: string; trialEndsAt: Date | null } | null =
    null;
  if (user.businessId) {
    subscription = await db.subscription.findUnique({
      where: { businessId: user.businessId },
      select: { plan: true, status: true, trialEndsAt: true },
    });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    business: user.business,
    subscription,
  });
}
