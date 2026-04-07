import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

function progressKey(email: string) {
  return `progress_${email.toLowerCase().trim()}`;
}

// GET /api/progress?email=xxx — returns completed lesson IDs for user
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ completedLessons: [] });

    const key = progressKey(email);
    const rows = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    if (rows.length === 0) return NextResponse.json({ completedLessons: [] });

    const value = rows[0].value as { completedLessons?: string[] } | null;
    return NextResponse.json({ completedLessons: value?.completedLessons || [] });
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

    const key = progressKey(email);
    const rows = await db.select().from(adminSettings).where(eq(adminSettings.key, key));

    let current: string[] = [];
    if (rows.length > 0) {
      const val = rows[0].value as { completedLessons?: string[] } | null;
      current = val?.completedLessons || [];
    }

    if (completed) {
      if (!current.includes(lessonId)) {
        current = [...current, lessonId];
      }
    } else {
      current = current.filter((id) => id !== lessonId);
    }

    const value = { completedLessons: current };

    if (rows.length > 0) {
      await db.update(adminSettings).set({ value, updatedAt: new Date() }).where(eq(adminSettings.key, key));
    } else {
      await db.insert(adminSettings).values({ key, value });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
