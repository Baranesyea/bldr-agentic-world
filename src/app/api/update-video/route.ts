import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

const KEY = "update_video_settings";

interface UpdateVideoSettings {
  enabled: boolean;
  vimeoUrl: string;
  delaySec: number;
  version: string; // changes when admin sets a new video — used to track who's seen it
}

const DEFAULTS: UpdateVideoSettings = { enabled: false, vimeoUrl: "", delaySec: 3, version: "" };

export async function GET() {
  try {
    const rows = await db.select().from(adminSettings).where(eq(adminSettings.key, KEY));
    if (rows.length === 0) return NextResponse.json(DEFAULTS);
    return NextResponse.json(rows[0].value);
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const value: UpdateVideoSettings = {
      enabled: !!body.enabled,
      vimeoUrl: body.vimeoUrl || "",
      delaySec: body.delaySec ?? 3,
      version: body.version || new Date().toISOString(),
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
