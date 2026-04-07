import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessons } from "@/lib/schema";
import { eq } from "drizzle-orm";

// POST /api/lessons/duration — auto-save duration discovered from Vimeo player
// Body: { lessonId, duration } (duration in seconds)
export async function POST(req: NextRequest) {
  try {
    const { lessonId, duration } = await req.json();
    if (!lessonId || !duration || duration < 5) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    // Only update if lesson has no duration yet
    const [lesson] = await db.select({ id: lessons.id, duration: lessons.duration }).from(lessons).where(eq(lessons.id, lessonId));
    if (!lesson) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (lesson.duration && lesson.duration > 0) return NextResponse.json({ ok: true, skipped: true });

    await db.update(lessons).set({ duration: Math.round(duration) }).where(eq(lessons.id, lessonId));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
