import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";

// GET /api/notifications?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const results = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return NextResponse.json(results);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}

// POST /api/notifications — create a notification
// Body: { userId, class, content, link?, channel? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, class: notifClass, content, link, channel } = body;
    if (!userId || !notifClass || !content) {
      return NextResponse.json({ error: "userId, class, and content required" }, { status: 400 });
    }

    const [notif] = await db.insert(notifications).values({
      userId,
      class: notifClass,
      content,
      link: link || null,
      channel: channel || "in_app",
    }).returning();

    return NextResponse.json(notif, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}

// PUT /api/notifications — mark as read
// Body: { id, read } or { userId, readAll: true }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.readAll && body.userId) {
      await db.update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.userId, body.userId), eq(notifications.read, false)));
      return NextResponse.json({ ok: true });
    }

    if (body.id) {
      await db.update(notifications)
        .set({ read: body.read ?? true })
        .where(eq(notifications.id, body.id));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "id or (userId + readAll) required" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}
