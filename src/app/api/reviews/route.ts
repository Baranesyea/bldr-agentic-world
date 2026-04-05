import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviews, adminSettings } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

// GET — list all reviews
export async function GET() {
  try {
    const all = await db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(200);
    return NextResponse.json(all);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST — submit a review
export async function POST(req: NextRequest) {
  try {
    const { userEmail, userName, stars, text, wantsVideo, triggerType } = await req.json();

    if (!userEmail || !stars) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [review] = await db.insert(reviews).values({
      userEmail,
      userName: userName || null,
      stars,
      text: text || null,
      wantsVideo: wantsVideo || false,
      triggerType: triggerType || "manual",
    }).returning();

    // If wants video, send webhook
    if (wantsVideo) {
      try {
        const settingsRows = await db.select().from(adminSettings).where(eq(adminSettings.key, "review_settings"));
        const settings = settingsRows[0]?.value as { webhookUrl?: string; webhookEnabled?: boolean } | undefined;
        if (settings?.webhookEnabled && settings?.webhookUrl) {
          await fetch(settings.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "review_video_request",
              email: userEmail,
              name: userName,
              stars,
              text,
              reviewId: review.id,
            }),
          });
          await db.update(reviews).set({ webhookSent: true }).where(eq(reviews.id, review.id));
        }
      } catch {}
    }

    return NextResponse.json(review);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
