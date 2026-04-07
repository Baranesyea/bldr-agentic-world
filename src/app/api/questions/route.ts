import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supportQuestions, questionReplies, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import postgres from "postgres";

// GET /api/questions — list all questions with replies
// Query: ?courseId=X&lessonId=Y&status=pending&resolvedByAdmin=false
export async function GET(req: NextRequest) {
  try {
    const courseId = req.nextUrl.searchParams.get("courseId");
    const lessonId = req.nextUrl.searchParams.get("lessonId");
    const status = req.nextUrl.searchParams.get("status");
    const resolved = req.nextUrl.searchParams.get("resolvedByAdmin");

    let questions = await db
      .select()
      .from(supportQuestions)
      .orderBy(desc(supportQuestions.createdAt));

    if (courseId) questions = questions.filter((q) => q.courseId === courseId);
    if (lessonId) questions = questions.filter((q) => q.lessonId === lessonId);
    if (status) questions = questions.filter((q) => q.status === status);
    if (resolved === "false") questions = questions.filter((q) => !q.resolvedByAdmin);
    if (resolved === "true") questions = questions.filter((q) => q.resolvedByAdmin);

    // Load replies
    const questionIds = questions.map((q) => q.id);
    let allReplies: Array<Record<string, unknown>> = [];
    if (questionIds.length > 0) {
      const sql = postgres(process.env.DATABASE_URL!);
      allReplies = await sql`SELECT * FROM question_replies WHERE question_id = ANY(${questionIds}) ORDER BY created_at ASC`;
      await sql.end();
    }

    const repliesByQuestion = new Map<string, typeof allReplies>();
    for (const r of allReplies) {
      const qId = r.question_id as string;
      if (!repliesByQuestion.has(qId)) repliesByQuestion.set(qId, []);
      repliesByQuestion.get(qId)!.push(r);
    }

    const result = questions.map((q) => ({
      ...q,
      replies: repliesByQuestion.get(q.id) || [],
    }));

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}

// POST /api/questions — create a new question
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, title, description, courseId, lessonId, courseName, lessonTitle, mediaLink, userName } = body;
    if (!title || !description) return NextResponse.json({ error: "title and description required" }, { status: 400 });

    // Find user by email
    let userId: string | null = null;
    if (email) {
      const sql = postgres(process.env.DATABASE_URL!);
      const [profile] = await sql`SELECT id FROM profiles WHERE LOWER(email) = ${email.toLowerCase().trim()}`;
      await sql.end();
      if (profile) userId = profile.id;
    }
    if (!userId && email) {
      const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase().trim()));
      userId = user?.id || null;
    }
    if (!userId) return NextResponse.json({ error: "user not found" }, { status: 404 });

    const [question] = await db.insert(supportQuestions).values({
      userId,
      title,
      description,
      courseId: courseId || null,
      lessonId: lessonId || null,
      courseName: courseName || null,
      lessonTitle: lessonTitle || null,
      userName: userName || null,
      userEmail: email || null,
      mediaLink: mediaLink || null,
      status: "pending",
    }).returning();

    return NextResponse.json(question, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}

// PUT /api/questions — update question (admin: resolve, answer, change status)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, adminResponse, resolvedByAdmin } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (adminResponse !== undefined) {
      updates.adminResponse = adminResponse;
      updates.answeredAt = new Date();
      updates.status = "answered";
    }
    if (resolvedByAdmin !== undefined) updates.resolvedByAdmin = resolvedByAdmin;

    await db.update(supportQuestions).set(updates).where(eq(supportQuestions.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}

// DELETE /api/questions?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.delete(supportQuestions).where(eq(supportQuestions.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}
