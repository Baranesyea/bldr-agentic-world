import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailLogs } from "@/lib/schema";
import { eq } from "drizzle-orm";

// Resend sends webhook events for: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (!data?.email_id) {
      return NextResponse.json({ ok: true });
    }

    const resendId = data.email_id;

    switch (type) {
      case "email.delivered":
        await db
          .update(emailLogs)
          .set({ status: "delivered", deliveredAt: new Date() })
          .where(eq(emailLogs.resendId, resendId));
        break;

      case "email.opened":
        await db
          .update(emailLogs)
          .set({ status: "opened", openedAt: new Date() })
          .where(eq(emailLogs.resendId, resendId));
        break;

      case "email.clicked":
        await db
          .update(emailLogs)
          .set({ status: "clicked", clickedAt: new Date() })
          .where(eq(emailLogs.resendId, resendId));
        break;

      case "email.bounced":
        await db
          .update(emailLogs)
          .set({ status: "bounced", bouncedAt: new Date() })
          .where(eq(emailLogs.resendId, resendId));
        break;

      case "email.complained":
        await db
          .update(emailLogs)
          .set({ status: "complained" })
          .where(eq(emailLogs.resendId, resendId));
        break;
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Always return 200 to Resend
  }
}
