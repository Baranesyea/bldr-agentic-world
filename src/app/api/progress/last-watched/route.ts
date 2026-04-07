import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

// We store last-watched per user in adminSettings with key "last_watched_{email}"
// This stores: { lessonId, courseId, courseTitle, lessonTitle, watchPosition, updatedAt }

function settingsKey(email: string) {
  return `last_watched_${email.toLowerCase().trim()}`;
}

// GET /api/progress/last-watched?email=xxx
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json(null);

    const key = settingsKey(email);
    const rows = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    if (rows.length === 0) return NextResponse.json(null);
    return NextResponse.json(rows[0].value);
  } catch {
    return NextResponse.json(null);
  }
}

// POST /api/progress/last-watched
// Body: { email, lessonId, courseId, courseTitle, lessonTitle, watchPosition }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, lessonId, courseId, courseTitle, lessonTitle, watchPosition } = body;
    if (!email || !lessonId) return NextResponse.json({ error: "missing fields" }, { status: 400 });

    const key = settingsKey(email);
    const value = {
      lessonId,
      courseId,
      courseTitle: courseTitle || "",
      lessonTitle: lessonTitle || "",
      watchPosition: watchPosition || 0,
      updatedAt: new Date().toISOString(),
    };

    const existing = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    if (existing.length > 0) {
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
