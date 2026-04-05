import { NextResponse } from "next/server";

export async function GET() {
  try {
    const postgres = (await import("postgres")).default;
    const sql = postgres(process.env.DATABASE_URL!);

    // Get school memberships from school_memberships table (logged-in users)
    const memberships = await sql`
      SELECT sm.user_id, p.email, sm.school_id
      FROM school_memberships sm
      JOIN profiles p ON p.id = sm.user_id
    `;

    // Also get school assignments from members table (imported users not yet logged in)
    const memberSchools = await sql`
      SELECT m.email, m.school_id
      FROM members m
      WHERE m.school_id IS NOT NULL AND m.status = 'active'
    `;

    // Get all blocked courses
    const blocked = await sql`
      SELECT uca.user_id, p.email, uca.course_id
      FROM user_course_access uca
      JOIN profiles p ON p.id = uca.user_id
      WHERE uca.is_available = false
    `;

    await sql.end();

    // Build map by email
    const map: Record<string, { schoolIds: string[]; blockedCourseIds: string[] }> = {};

    for (const m of memberships) {
      const email = m.email.toLowerCase();
      if (!map[email]) map[email] = { schoolIds: [], blockedCourseIds: [] };
      if (!map[email].schoolIds.includes(m.school_id)) {
        map[email].schoolIds.push(m.school_id);
      }
    }

    for (const m of memberSchools) {
      const email = m.email.toLowerCase();
      if (!map[email]) map[email] = { schoolIds: [], blockedCourseIds: [] };
      if (!map[email].schoolIds.includes(m.school_id)) {
        map[email].schoolIds.push(m.school_id);
      }
    }

    for (const b of blocked) {
      const email = b.email.toLowerCase();
      if (!map[email]) map[email] = { schoolIds: [], blockedCourseIds: [] };
      map[email].blockedCourseIds.push(b.course_id);
    }

    return NextResponse.json(map);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
