import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

const KEY = "whatsapp_cta";

export async function GET() {
  try {
    const rows = await db.select().from(adminSettings).where(eq(adminSettings.key, KEY));
    if (rows.length === 0) {
      return NextResponse.json({ url: "", enabled: false });
    }
    return NextResponse.json(rows[0].value);
  } catch {
    return NextResponse.json({ url: "", enabled: false });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const value = {
      url: body.url || "",
      enabled: !!body.enabled,
    };
    const existing = await db.select().from(adminSettings).where(eq(adminSettings.key, KEY));
    if (existing.length > 0) {
      await db.update(adminSettings).set({ value, updatedAt: new Date() }).where(eq(adminSettings.key, KEY));
    } else {
      await db.insert(adminSettings).values({ key: KEY, value });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
