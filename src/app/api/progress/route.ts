import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProgress, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

async function getUserByEmail(email: string) {
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
  return rows[0] || null;
}

// GET /api/progress?email=xxx — returns completed lesson IDs for user
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ completedLessons: [] });

    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ completedLessons: [] });

    const rows = await db
      .select({ lessonId: userProgress.lessonId })
      .from(userProgress)
      .where(and(eq(userProgress.userId, user.id), eq(userProgress.status, "completed")));

    return NextResponse.json({ completedLessons: rows.map((r) => r.lessonId) });
  } catch {
    return NextResponse.json({ completedLessons: [] });
  }
}

// POST /api/progress — mark lesson completed or uncompleted
// Body: { email, lessonId, completed: boolean }
export async function POST(req: NextRequest) {
  try {
    const { email, lessonId, completed } = await req.json();
    if (!email || !lessonId) return NextResponse.json({ error: "missing fields" }, { status: 400 });

    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

    const existing = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, user.id), eq(userProgress.lessonId, lessonId)));

    if (completed) {
      if (existing.length > 0) {
        await db
          .update(userProgress)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(userProgress.id, existing[0].id));
      } else {
        await db.insert(userProgress).values({
          userId: user.id,
          lessonId,
          status: "completed",
          completedAt: new Date(),
        });
      }
    } else {
      // Uncomplete — delete the row
      if (existing.length > 0) {
        await db.delete(userProgress).where(eq(userProgress.id, existing[0].id));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
