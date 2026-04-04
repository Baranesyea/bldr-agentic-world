import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedback } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const all = await db.select().from(feedback).orderBy(desc(feedback.createdAt));
    return NextResponse.json(all);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userName, userEmail, category, message, mood, pageUrl, attachmentUrl, status } = body;

    const [row] = await db
      .insert(feedback)
      .values({
        userName: userName || "אורח",
        userEmail: userEmail || null,
        type: category || "אחר",
        message: message || "",
        rating: mood ?? null,
        category: category || null,
        mood: mood ?? null,
        pageUrl: pageUrl || null,
        attachmentUrl: attachmentUrl || null,
        status: status || "new",
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const [row] = await db
      .update(feedback)
      .set({ status })
      .where(eq(feedback.id, id))
      .returning();
    return NextResponse.json(row);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
