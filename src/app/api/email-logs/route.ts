import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailLogs } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

// GET — list logs, optionally filter by email
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    let logs;
    if (email) {
      logs = await db
        .select()
        .from(emailLogs)
        .where(eq(emailLogs.toEmail, email.toLowerCase()))
        .orderBy(desc(emailLogs.createdAt))
        .limit(100);
    } else {
      logs = await db
        .select()
        .from(emailLogs)
        .orderBy(desc(emailLogs.createdAt))
        .limit(200);
    }

    return NextResponse.json(logs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
