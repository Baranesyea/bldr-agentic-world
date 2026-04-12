import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeBase } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/knowledge — list all Q&A entries
export async function GET() {
  try {
    const entries = await db
      .select()
      .from(knowledgeBase)
      .orderBy(desc(knowledgeBase.createdAt));
    return NextResponse.json(entries);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}

// POST /api/knowledge — create a new Q&A entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, answer, category, tags, source } = body;
    if (!question || !answer) return NextResponse.json({ error: "question and answer required" }, { status: 400 });

    const [entry] = await db.insert(knowledgeBase).values({
      question,
      answer,
      category: category || null,
      tags: tags || [],
      source: source || "manual",
    }).returning();

    return NextResponse.json(entry, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}

// PUT /api/knowledge — update an entry
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, question, answer, category, tags } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (question !== undefined) updates.question = question;
    if (answer !== undefined) updates.answer = answer;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;

    await db.update(knowledgeBase).set(updates).where(eq(knowledgeBase.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}

// DELETE /api/knowledge?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}
