import { db } from "@/lib/db";
import { adminSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
  }
  const rows = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, key))
    .limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ value: null });
  }
  return NextResponse.json({ value: rows[0].value });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { key, value } = body as { key: string; value: unknown };
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  // Upsert: try update first, insert if not found
  const existing = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, key))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(adminSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(adminSettings.key, key));
  } else {
    await db.insert(adminSettings).values({ key, value });
  }

  return NextResponse.json({ ok: true });
}
