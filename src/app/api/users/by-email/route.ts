import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  try {
    const postgres = (await import("postgres")).default;
    const sql = postgres(process.env.DATABASE_URL!);
    const [user] = await sql`SELECT id, email, full_name, avatar_url, role FROM profiles WHERE email = ${email.toLowerCase().trim()}`;
    await sql.end();
    if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

    // Also get school memberships
    const sql2 = postgres(process.env.DATABASE_URL!);
    const memberships = await sql2`SELECT school_id FROM school_memberships WHERE user_id = ${user.id}`;
    const blockedCourses = await sql2`SELECT course_id FROM user_course_access WHERE user_id = ${user.id} AND is_available = false`;
    await sql2.end();

    return NextResponse.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url || null,
      role: user.role || "member",
      schoolIds: memberships.map((m) => (m as unknown as { school_id: string }).school_id),
      blockedCourseIds: blockedCourses.map((c) => (c as unknown as { course_id: string }).course_id),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
