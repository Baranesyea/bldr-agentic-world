import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

const KEY = "review_settings";

const DEFAULTS = {
  enabled: true,
  triggers: [
    { type: "time", label: "אחרי 20 דקות במערכת", minutesInSystem: 20, enabled: true },
    { type: "login_count", label: "אחרי התחברות שלישית", loginCount: 3, enabled: true },
  ],
  webhookUrl: "",
  webhookEnabled: false,
  popupTitle: "איך החוויה שלך עד עכשיו?",
  lowRatingMessage: "תודה על זה. אני עושה הכל כדי לשפר את החוויה שלכם פה. ומבטיח להמשיך לעשות את זה.",
  highRatingMessage: "תודה על זה!\nואם ממש בא לך לעזור, סרטון קצר שלך אומר את הדברים יעזור לנו הרבה יותר!",
  videoAcceptedMessage: "איזה כיף! שלחתי לך הודעה לוואצאפ!",
};

export async function GET() {
  try {
    const rows = await db.select().from(adminSettings).where(eq(adminSettings.key, KEY));
    if (rows.length === 0) return NextResponse.json(DEFAULTS);
    return NextResponse.json({ ...DEFAULTS, ...(rows[0].value as object) });
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = await db.select().from(adminSettings).where(eq(adminSettings.key, KEY));
    if (existing.length > 0) {
      await db.update(adminSettings).set({ value: body, updatedAt: new Date() }).where(eq(adminSettings.key, KEY));
    } else {
      await db.insert(adminSettings).values({ key: KEY, value: body });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
