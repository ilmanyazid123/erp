// GET  /api/chat?channel=general — latest team chat messages (ascending)
// POST /api/chat — send a message to a channel

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
  const channel = url.searchParams.get("channel") ?? "general";

  const messages = await db.chatMessage.findMany({
    where: { businessId, channel },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.email) return unauthorized();
  const businessId = await getCurrentBusinessId();
  if (!businessId) return unauthorized();

  try {
    const body = await req.json();
    const content = String(body.content ?? "").trim();
    if (!content) return apiError("Pesan tidak boleh kosong.");
    const channel = body.channel ? String(body.channel) : "general";

    const message = await db.chatMessage.create({
      data: {
        businessId,
        channel,
        content,
        userId: ((session.user as unknown as { id?: string }).id ?? null) ?? null,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    console.error("POST /api/chat", e);
    return apiError("Gagal mengirim pesan.", 500);
  }
}
