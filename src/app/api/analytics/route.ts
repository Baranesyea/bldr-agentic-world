import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyticsEvents } from "@/lib/schema";
import { sql, eq, and, gte, lte, desc, count, countDistinct } from "drizzle-orm";

function parseDeviceType(ua: string): string {
  if (!ua) return "unknown";
  if (/mobile|android|iphone|ipod/i.test(ua)) return "mobile";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  return "desktop";
}

const VALID_EVENT_TYPES = [
  "login", "page_view", "video_play", "video_progress",
  "note_created", "question_asked", "session_start", "session_heartbeat",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, eventData, sessionId, pageUrl, userEmail } = body;

    if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    const ua = request.headers.get("user-agent") || "";
    const deviceType = parseDeviceType(ua);

    await db.insert(analyticsEvents).values({
      userEmail: userEmail || null,
      eventType,
      eventData: eventData || {},
      deviceType,
      userAgent: ua,
      sessionId: sessionId || null,
      pageUrl: pageUrl || null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Analytics POST error:", error);
    return NextResponse.json({ error: "Failed to save event" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "overview";
    const email = searchParams.get("email");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : now;

    if (view === "user" && email) {
      // User detail view
      const events = await db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.userEmail, email),
            gte(analyticsEvents.createdAt, fromDate),
            lte(analyticsEvents.createdAt, toDate)
          )
        )
        .orderBy(desc(analyticsEvents.createdAt))
        .limit(1000);

      // Aggregate stats
      const loginCount = events.filter(e => e.eventType === "login").length;
      const lastLogin = events.find(e => e.eventType === "login")?.createdAt;
      const devices = [...new Set(events.map(e => e.deviceType).filter(Boolean))];
      const videoProgressEvents = events.filter(e => e.eventType === "video_progress");
      const totalVideoSeconds = videoProgressEvents.reduce((sum, e) => {
        const data = e.eventData as Record<string, number>;
        return sum + (data?.seconds || 0);
      }, 0);
      const notesCount = events.filter(e => e.eventType === "note_created").length;
      const questionsCount = events.filter(e => e.eventType === "question_asked").length;

      // Sessions
      const sessionIds = [...new Set(events.map(e => e.sessionId).filter(Boolean))];
      const sessions = sessionIds.map(sid => {
        const sessionEvents = events.filter(e => e.sessionId === sid);
        const heartbeats = sessionEvents.filter(e => e.eventType === "session_heartbeat");
        const lastHeartbeat = heartbeats.length > 0
          ? Math.max(...heartbeats.map(h => ((h.eventData as Record<string, number>)?.activeDuration || 0)))
          : 0;
        const pages = [...new Set(sessionEvents.filter(e => e.eventType === "page_view").map(e => (e.eventData as Record<string, string>)?.path).filter(Boolean))];
        const startTime = sessionEvents[sessionEvents.length - 1]?.createdAt;
        return { sessionId: sid, startTime, durationSeconds: lastHeartbeat, pagesViewed: pages.length, pages };
      });

      // Course progress from video_progress events
      const courseMap = new Map<string, { courseId: string; lessons: Set<string>; totalSeconds: number }>();
      videoProgressEvents.forEach(e => {
        const data = e.eventData as Record<string, string | number>;
        const cid = data?.courseId as string;
        const lid = data?.lessonId as string;
        if (!cid) return;
        if (!courseMap.has(cid)) courseMap.set(cid, { courseId: cid, lessons: new Set(), totalSeconds: 0 });
        const entry = courseMap.get(cid)!;
        if (lid) entry.lessons.add(lid);
        entry.totalSeconds += (data?.seconds as number) || 0;
      });

      return NextResponse.json({
        view: "user",
        email,
        loginCount,
        lastLogin,
        devices,
        videoMinutes: Math.round(totalVideoSeconds / 60),
        notesCount,
        questionsCount,
        sessions,
        courses: Array.from(courseMap.values()).map(c => ({
          courseId: c.courseId,
          lessonsWatched: c.lessons.size,
          totalMinutes: Math.round(c.totalSeconds / 60),
        })),
      });
    }

    if (view === "users") {
      // List all users with summary stats
      const userStats = await db
        .select({
          userEmail: analyticsEvents.userEmail,
          eventCount: count(),
          lastSeen: sql<string>`MAX(${analyticsEvents.createdAt})`,
        })
        .from(analyticsEvents)
        .where(
          and(
            sql`${analyticsEvents.userEmail} IS NOT NULL`,
            gte(analyticsEvents.createdAt, fromDate),
            lte(analyticsEvents.createdAt, toDate)
          )
        )
        .groupBy(analyticsEvents.userEmail)
        .orderBy(sql`MAX(${analyticsEvents.createdAt}) DESC`)
        .limit(200);

      return NextResponse.json({ view: "users", users: userStats });
    }

    // Overview
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Active users last 30 days
    const [activeUsers30d] = await db
      .select({ count: countDistinct(analyticsEvents.userEmail) })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, monthAgo));

    // Sessions today/week/month
    const [sessionsToday] = await db
      .select({ count: countDistinct(analyticsEvents.sessionId) })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "session_start"), gte(analyticsEvents.createdAt, today)));

    const [sessionsWeek] = await db
      .select({ count: countDistinct(analyticsEvents.sessionId) })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "session_start"), gte(analyticsEvents.createdAt, weekAgo)));

    const [sessionsMonth] = await db
      .select({ count: countDistinct(analyticsEvents.sessionId) })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "session_start"), gte(analyticsEvents.createdAt, monthAgo)));

    // Total video minutes
    const videoProgressRows = await db
      .select({ eventData: analyticsEvents.eventData })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "video_progress"), gte(analyticsEvents.createdAt, fromDate)));

    const totalVideoMinutes = Math.round(
      videoProgressRows.reduce((sum, r) => sum + ((r.eventData as Record<string, number>)?.seconds || 0), 0) / 60
    );

    // Average session duration from heartbeats
    const heartbeats = await db
      .select({
        sessionId: analyticsEvents.sessionId,
        maxDuration: sql<number>`MAX((${analyticsEvents.eventData}->>'activeDuration')::int)`,
      })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "session_heartbeat"), gte(analyticsEvents.createdAt, fromDate)))
      .groupBy(analyticsEvents.sessionId);

    const avgSessionMinutes = heartbeats.length > 0
      ? Math.round(heartbeats.reduce((s, h) => s + (h.maxDuration || 0), 0) / heartbeats.length / 60)
      : 0;

    // Daily active users (last 30 days)
    const dailyActiveUsers = await db
      .select({
        day: sql<string>`DATE(${analyticsEvents.createdAt})`,
        users: countDistinct(analyticsEvents.userEmail),
      })
      .from(analyticsEvents)
      .where(and(sql`${analyticsEvents.userEmail} IS NOT NULL`, gte(analyticsEvents.createdAt, monthAgo)))
      .groupBy(sql`DATE(${analyticsEvents.createdAt})`)
      .orderBy(sql`DATE(${analyticsEvents.createdAt})`);

    // Video hours by day
    const videoByDay = await db
      .select({
        day: sql<string>`DATE(${analyticsEvents.createdAt})`,
        eventData: analyticsEvents.eventData,
      })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "video_progress"), gte(analyticsEvents.createdAt, monthAgo)));

    const videoHoursByDay = new Map<string, number>();
    videoByDay.forEach(r => {
      const day = String(r.day).slice(0, 10);
      const seconds = (r.eventData as Record<string, number>)?.seconds || 0;
      videoHoursByDay.set(day, (videoHoursByDay.get(day) || 0) + seconds);
    });
    const videoHoursChart = Array.from(videoHoursByDay.entries())
      .map(([day, sec]) => ({ day, hours: Math.round(sec / 3600 * 10) / 10 }))
      .sort((a, b) => a.day.localeCompare(b.day));

    // Peak hours
    const peakHours = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${analyticsEvents.createdAt})`,
        count: count(),
      })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, monthAgo))
      .groupBy(sql`EXTRACT(HOUR FROM ${analyticsEvents.createdAt})`)
      .orderBy(sql`count(*) DESC`)
      .limit(24);

    // Most watched lessons (top 10)
    const topLessons = await db
      .select({
        lessonId: sql<string>`${analyticsEvents.eventData}->>'lessonId'`,
        lessonTitle: sql<string>`MAX(${analyticsEvents.eventData}->>'lessonTitle')`,
        views: count(),
      })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "video_play"), gte(analyticsEvents.createdAt, fromDate)))
      .groupBy(sql`${analyticsEvents.eventData}->>'lessonId'`)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Most active users (top 10)
    const topUsers = await db
      .select({
        userEmail: analyticsEvents.userEmail,
        eventCount: count(),
      })
      .from(analyticsEvents)
      .where(and(sql`${analyticsEvents.userEmail} IS NOT NULL`, gte(analyticsEvents.createdAt, fromDate)))
      .groupBy(analyticsEvents.userEmail)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    return NextResponse.json({
      view: "overview",
      activeUsers30d: activeUsers30d?.count || 0,
      sessionsToday: sessionsToday?.count || 0,
      sessionsWeek: sessionsWeek?.count || 0,
      sessionsMonth: sessionsMonth?.count || 0,
      totalVideoMinutes,
      avgSessionMinutes,
      dailyActiveUsers,
      videoHoursChart,
      peakHours,
      topLessons,
      topUsers,
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
