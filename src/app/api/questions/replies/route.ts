import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questionReplies, supportQuestions } from "@/lib/schema";
import { eq } from "drizzle-orm";

// POST /api/questions/replies — add a reply to a question
// Body: { questionId, content, userName?, userEmail?, isAdmin?, parentReplyId? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionId, content, userName, userEmail, isAdmin, parentReplyId } = body;
    if (!questionId || !content) return NextResponse.json({ error: "questionId and content required" }, { status: 400 });

    const [reply] = await db.insert(questionReplies).values({
      questionId,
      content,
      userName: userName || null,
      userEmail: userEmail || null,
      isAdmin: isAdmin || false,
      parentReplyId: parentReplyId || null,
    }).returning();

    // If admin reply, mark question as answered
    if (isAdmin) {
      await db.update(supportQuestions).set({
        status: "answered",
        answeredAt: new Date(),
      }).where(eq(supportQuestions.id, questionId));
    }

    return NextResponse.json(reply, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}

// DELETE /api/questions/replies?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.delete(questionReplies).where(eq(questionReplies.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}
