import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

    // Mark profile as deleted (keep role valid, clear name)
    await sql`UPDATE profiles SET bio = 'DELETED', full_name = '[deleted]' WHERE email = ${email}`;

    await sql.end();

    // Invalidate all sessions for this user via Supabase Admin API
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Find the auth user by email and sign them out globally
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = users.find((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase().trim());
      if (authUser) {
        await supabaseAdmin.auth.admin.signOut(authUser.id, "global");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Delete account error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
