import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members, users, schoolMemberships } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { emails, schoolId, accessExpiresAt, expiryMode } = await req.json();

    if (!Array.isArray(emails) || !schoolId) {
      return NextResponse.json(
        { error: "emails (array) and schoolId are required" },
        { status: 400 }
      );
    }

    const normalizedEmails = emails.map((e: string) => e.toLowerCase().trim());
    const expiry = accessExpiresAt ? new Date(accessExpiresAt) : null;
    const mode = expiryMode || "full_lock";

    // 1. Find all users that exist in users table (batch query)
    const existingUsers = normalizedEmails.length > 0
      ? await db
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(inArray(users.email, normalizedEmails))
      : [];

    const userEmailSet = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    // 2. Bulk upsert school memberships for existing users
    if (existingUsers.length > 0) {
      for (const u of existingUsers) {
        await db
          .insert(schoolMemberships)
          .values({
            userId: u.id,
            schoolId,
            role: "student",
            accessExpiresAt: expiry,
            expiryMode: mode,
          })
          .onConflictDoUpdate({
            target: [schoolMemberships.userId, schoolMemberships.schoolId],
            set: {
              role: "student",
              accessExpiresAt: expiry,
              expiryMode: mode,
            },
          });
      }
    }

    // 3. Bulk update members table for those without users entry
    const pendingEmails = normalizedEmails.filter((e: string) => !userEmailSet.has(e));
    if (pendingEmails.length > 0) {
      await db
        .update(members)
        .set({
          schoolId,
          accessExpiresAt: expiry,
          expiryMode: mode as "full_lock" | "partial_lock",
          updatedAt: new Date(),
        })
        .where(inArray(members.email, pendingEmails));
    }

    return NextResponse.json({
      linked: existingUsers.length,
      pending: pendingEmails.length,
      total: normalizedEmails.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
