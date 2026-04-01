import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

const SETTINGS_KEY = "case_study_requests";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = body.request;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Request text is required" }, { status: 400 });
    }

    const entry = {
      id: crypto.randomUUID(),
      request: text.trim(),
      createdAt: new Date().toISOString(),
    };

    // Get existing requests
    const [row] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, SETTINGS_KEY));

    const existing = Array.isArray(row?.value) ? (row.value as Record<string, unknown>[]) : [];
    existing.push(entry);

    if (row) {
      await db
        .update(adminSettings)
        .set({ value: existing, updatedAt: new Date() })
        .where(eq(adminSettings.key, SETTINGS_KEY));
    } else {
      await db.insert(adminSettings).values({
        key: SETTINGS_KEY,
        value: existing,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
