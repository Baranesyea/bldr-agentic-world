import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailTemplates } from "@/lib/schema";
import { eq } from "drizzle-orm";

// GET — list all templates
export async function GET() {
  try {
    const templates = await db.select().from(emailTemplates).orderBy(emailTemplates.createdAt);
    return NextResponse.json(templates);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST — create or update template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, slug, name, subject, bodyHtml, variables, isActive } = body;

    if (!slug || !name || !subject || !bodyHtml) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (id) {
      // Update existing
      const [updated] = await db
        .update(emailTemplates)
        .set({ slug, name, subject, bodyHtml, variables: variables || [], isActive: isActive ?? true, updatedAt: new Date() })
        .where(eq(emailTemplates.id, id))
        .returning();
      return NextResponse.json(updated);
    } else {
      // Create new
      const [created] = await db
        .insert(emailTemplates)
        .values({ slug, name, subject, bodyHtml, variables: variables || [], isActive: isActive ?? true })
        .returning();
      return NextResponse.json(created);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — remove template
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
