import { NextRequest, NextResponse } from "next/server";
import { getUserCourseAccessList, bulkSetUserCourseAccess } from "@/lib/data/user-course-access";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
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
    const { userId, courses, schoolId } = body;
    // courses: { courseId, isAvailable }[]
    if (!userId || !Array.isArray(courses)) {
      return NextResponse.json({ error: "userId and courses[] are required" }, { status: 400 });
    }
    await bulkSetUserCourseAccess(userId, courses, schoolId);
    const updated = await getUserCourseAccessList(userId, schoolId);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
