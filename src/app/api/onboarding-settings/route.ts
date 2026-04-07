import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

const STEPS_KEY = "onboarding_steps";
const SETTINGS_KEY = "onboarding_settings";

// GET /api/onboarding-settings — returns steps + settings
export async function GET() {
  try {
    const rows = await db.select().from(adminSettings).where(
      eq(adminSettings.key, STEPS_KEY)
    );
    const settingsRows = await db.select().from(adminSettings).where(
      eq(adminSettings.key, SETTINGS_KEY)
    );

    return NextResponse.json({
      steps: rows[0]?.value || null,
      settings: settingsRows[0]?.value || null,
    });
  } catch {
    return NextResponse.json({ steps: null, settings: null });
  }
}

// PUT /api/onboarding-settings — save steps and/or settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.steps !== undefined) {
      const existing = await db.select().from(adminSettings).where(eq(adminSettings.key, STEPS_KEY));
      if (existing.length > 0) {
        await db.update(adminSettings).set({ value: body.steps, updatedAt: new Date() }).where(eq(adminSettings.key, STEPS_KEY));
      } else {
        await db.insert(adminSettings).values({ key: STEPS_KEY, value: body.steps });
      }
    }

    if (body.settings !== undefined) {
      const existing = await db.select().from(adminSettings).where(eq(adminSettings.key, SETTINGS_KEY));
      if (existing.length > 0) {
        await db.update(adminSettings).set({ value: body.settings, updatedAt: new Date() }).where(eq(adminSettings.key, SETTINGS_KEY));
      } else {
        await db.insert(adminSettings).values({ key: SETTINGS_KEY, value: body.settings });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}
