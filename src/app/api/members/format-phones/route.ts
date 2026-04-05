import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members } from "@/lib/schema";
import { formatPhoneE164 } from "@/lib/format-phone";
import { eq, isNotNull } from "drizzle-orm";

// POST — format all existing phone numbers to E.164
export async function POST() {
  try {
    const all = await db.select({ id: members.id, phone: members.phone }).from(members).where(isNotNull(members.phone));
    let updated = 0;

    for (const m of all) {
      if (!m.phone) continue;
      const formatted = formatPhoneE164(m.phone);
      if (formatted && formatted !== m.phone) {
        await db.update(members).set({ phone: formatted }).where(eq(members.id, m.id));
        updated++;
      }
    }

    return NextResponse.json({ ok: true, total: all.length, updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
