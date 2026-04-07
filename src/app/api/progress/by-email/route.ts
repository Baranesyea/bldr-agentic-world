import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProgress, users, lessons, chapters, courses } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

// GET /api/progress/by-email?email=xxx — returns detailed progress for admin view
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ progress: [] });

    const userRows = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    const user = userRows[0];
    if (!user) return NextResponse.json({ progress: [] });

    const rows = await db
      .select({
        lessonId: userProgress.lessonId,
        status: userProgress.status,
        completedAt: userProgress.completedAt,
        lessonTitle: lessons.title,
        chapterTitle: chapters.title,
        courseTitle: courses.title,
        courseId: courses.id,
      })
      .from(userProgress)
      .innerJoin(lessons, eq(userProgress.lessonId, lessons.id))
      .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
      .innerJoin(courses, eq(chapters.courseId, courses.id))
      .where(and(eq(userProgress.userId, user.id), eq(userProgress.status, "completed")));

    // Group by course
    const byCourse: Record<string, { courseTitle: string; courseId: string; completedLessons: number; lessons: { title: string; completedAt: string | null }[] }> = {};
    for (const r of rows) {
      if (!byCourse[r.courseId]) {
        byCourse[r.courseId] = { courseTitle: r.courseTitle, courseId: r.courseId, completedLessons: 0, lessons: [] };
      }
      byCourse[r.courseId].completedLessons++;
      byCourse[r.courseId].lessons.push({ title: r.lessonTitle, completedAt: r.completedAt?.toISOString() || null });
    }

    return NextResponse.json({
      totalCompleted: rows.length,
      courses: Object.values(byCourse),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
