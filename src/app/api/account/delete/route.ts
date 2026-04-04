import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email, fullName, userType, deletedBy } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Dynamic import to avoid top-level connection issues
    const postgres = (await import("postgres")).default;
    const sql = postgres(process.env.DATABASE_URL!);

    // Log the deletion
    await sql`
      INSERT INTO deleted_accounts (email, full_name, user_type, deleted_by)
      VALUES (${email}, ${fullName || ""}, ${userType || "member"}, ${deletedBy || "user"})
    `;

    // Deactivate member record
    await db
      .update(members)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(eq(members.email, email.toLowerCase().trim()));

    // Deactivate in profiles table
    await sql`UPDATE profiles SET role = 'deleted' WHERE email = ${email}`;

    await sql.end();

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Delete account error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
