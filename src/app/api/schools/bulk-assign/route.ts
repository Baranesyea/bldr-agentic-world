import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { addMemberToSchool } from "@/lib/data/schools";

/**
 * Bulk assign a school to multiple users by their emails.
 * Works for both users with and without a `users` table entry —
 * for those without, it updates the members.schoolId field so the
 * membership is created when they first log in.
 */
export async function POST(req: NextRequest) {
  try {
    const { emails, schoolId, accessExpiresAt, expiryMode } = await req.json();

    if (!Array.isArray(emails) || !schoolId) {
      return NextResponse.json(
        { error: "emails (array) and schoolId are required" },
        { status: 400 }
      );
    }

    const expiry = accessExpiresAt ? new Date(accessExpiresAt) : null;
    let linked = 0;
    let pending = 0;

    for (const email of emails) {
      const normalizedEmail = email.toLowerCase().trim();

      // Try to find user in users table (has logged in)
      const [userRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail));

      if (userRow) {
        await addMemberToSchool({
          userId: userRow.id,
          schoolId,
          accessExpiresAt: expiry,
          expiryMode: expiryMode || "full_lock",
        });
        linked++;
      } else {
        // User hasn't logged in yet — update members table so it's picked up on first login
        await db
          .update(members)
          .set({
            schoolId,
            accessExpiresAt: expiry,
            expiryMode: expiryMode || "full_lock",
            updatedAt: new Date(),
          })
          .where(eq(members.email, normalizedEmail));
        pending++;
      }
    }

    return NextResponse.json({ linked, pending, total: emails.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
