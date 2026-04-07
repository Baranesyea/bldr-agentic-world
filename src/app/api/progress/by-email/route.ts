import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminSettings, lessons, chapters, courses } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

function progressKey(email: string) {
  return `progress_${email.toLowerCase().trim()}`;
}

// GET /api/progress/by-email?email=xxx — returns detailed progress for admin view
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ totalCompleted: 0, courses: [] });

    const key = progressKey(email);
    const rows = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    if (rows.length === 0) return NextResponse.json({ totalCompleted: 0, courses: [] });

    const value = rows[0].value as { completedLessons?: string[] } | null;
    const completedIds = value?.completedLessons || [];
    if (completedIds.length === 0) return NextResponse.json({ totalCompleted: 0, courses: [] });

    // Fetch lesson details
    const lessonRows = await db
      .select({ id: lessons.id, title: lessons.title, chapterId: lessons.chapterId })
      .from(lessons)
      .where(inArray(lessons.id, completedIds));

    const chapterIds = [...new Set(lessonRows.map((l) => l.chapterId))];
    const chapterRows = chapterIds.length > 0
      ? await db.select({ id: chapters.id, courseId: chapters.courseId }).from(chapters).where(inArray(chapters.id, chapterIds))
      : [];

    const courseIds = [...new Set(chapterRows.map((c) => c.courseId))];
    const courseRows = courseIds.length > 0
      ? await db.select({ id: courses.id, title: courses.title }).from(courses).where(inArray(courses.id, courseIds))
      : [];

    // Build lookup maps
    const chapterToCourse = new Map(chapterRows.map((c) => [c.id, c.courseId]));
    const courseMap = new Map(courseRows.map((c) => [c.id, c.title]));

    // Group by course
    const byCourse: Record<string, { courseTitle: string; completedLessons: number }> = {};
    for (const l of lessonRows) {
      const cId = chapterToCourse.get(l.chapterId) || "unknown";
      if (!byCourse[cId]) {
        byCourse[cId] = { courseTitle: courseMap.get(cId) || "קורס", completedLessons: 0 };
      }
      byCourse[cId].completedLessons++;
    }

    return NextResponse.json({
      totalCompleted: completedIds.length,
      courses: Object.values(byCourse),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
