import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { members, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { findAuthUserByEmail } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
  try {
    const { email, fullName, userType, deletedBy } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Dynamic import to avoid top-level connection issues
    const postgres = (await import("postgres")).default;
    const sql = postgres(process.env.DATABASE_URL!);

    const normalizedEmail = email.toLowerCase().trim();
    const isHardDelete = deletedBy === "admin";

    // Log the deletion
    await sql`
      INSERT INTO deleted_accounts (email, full_name, user_type, deleted_by)
      VALUES (${email}, ${fullName || ""}, ${userType || "member"}, ${deletedBy || "user"})
    `;

    if (isHardDelete) {
      // Admin hard-delete: remove row so email is free to be re-registered
      await db.delete(members).where(eq(members.email, normalizedEmail));
      await db.delete(users).where(eq(users.email, normalizedEmail));
      await sql`DELETE FROM profiles WHERE email = ${normalizedEmail}`;
    } else {
      // User self-delete: keep row for audit, mark inactive + anonymise profile
      await db
        .update(members)
        .set({ status: "inactive", updatedAt: new Date() })
        .where(eq(members.email, normalizedEmail));
      await sql`UPDATE profiles SET bio = 'DELETED', full_name = '[deleted]' WHERE email = ${normalizedEmail}`;
    }

    await sql.end();

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const authUser = await findAuthUserByEmail(supabaseAdmin, normalizedEmail);
      if (authUser) {
        if (isHardDelete) {
          await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        } else {
          await supabaseAdmin.auth.admin.signOut(authUser.id, "global");
        }
      }
    }

    return NextResponse.json({ ok: true, hardDeleted: isHardDelete });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Delete account error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
