import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientErrors } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

// POST /api/client-errors — log a client-side error
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, stack, url, userAgent, userEmail, userName } = body;
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

    const [entry] = await db.insert(clientErrors).values({
      message,
      stack: stack || null,
      url: url || null,
      userAgent: userAgent || null,
      userEmail: userEmail || null,
      userName: userName || null,
    }).returning();

    return NextResponse.json(entry, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}

// GET /api/client-errors — list all errors (admin)
export async function GET() {
  try {
    const errors = await db
      .select()
      .from(clientErrors)
      .orderBy(desc(clientErrors.createdAt))
      .limit(200);

    return NextResponse.json(errors);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}

// PUT /api/client-errors — mark as resolved
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await db.update(clientErrors)
      .set({ resolved: body.resolved ?? true })
      .where(eq(clientErrors.id, body.id));

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}
