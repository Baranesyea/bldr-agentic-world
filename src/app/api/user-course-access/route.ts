import { NextRequest, NextResponse } from "next/server";
import { getUserCourseAccessList, bulkSetUserCourseAccess } from "@/lib/data/user-course-access";

async function resolveUserId(idOrEmail: string): Promise<string | null> {
  // If it looks like a UUID, use as-is
  if (/^[0-9a-f]{8}-/.test(idOrEmail)) return idOrEmail;
  // Look up in profiles table (Supabase-managed, has all users)
  const postgres = (await import("postgres")).default;
  const sql = postgres(process.env.DATABASE_URL!);
  const [row] = await sql`SELECT id FROM profiles WHERE email = ${idOrEmail.toLowerCase().trim()}`;
  await sql.end();
  return row?.id || null;
}

export async function GET(req: NextRequest) {
  try {
    const userIdParam = req.nextUrl.searchParams.get("userId");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    if (!userIdParam) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    const userId = await resolveUserId(userIdParam);
    if (!userId) {
      return NextResponse.json([]);
    }
    const list = await getUserCourseAccessList(userId, schoolId);
    return NextResponse.json(list);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, courses, schoolId } = body;
    // courses: { courseId, isAvailable }[]
    const idOrEmail = userId || email;
    if (!idOrEmail || !Array.isArray(courses)) {
      return NextResponse.json({ error: "userId/email and courses[] are required" }, { status: 400 });
    }
    const resolvedId = await resolveUserId(idOrEmail);
    if (!resolvedId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    await bulkSetUserCourseAccess(resolvedId, courses, schoolId);
    const updated = await getUserCourseAccessList(resolvedId, schoolId);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
