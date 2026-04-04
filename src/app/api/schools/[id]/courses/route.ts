import { NextRequest, NextResponse } from "next/server";
import { getSchoolCourses, bulkSetSchoolCourses } from "@/lib/data/schools";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courses = await getSchoolCourses(id);
    return NextResponse.json(courses);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    // body.courses: { courseId, isAvailable, availableAfterExpiry? }[]
    if (!Array.isArray(body.courses)) {
      return NextResponse.json({ error: "courses array is required" }, { status: 400 });
    }
    await bulkSetSchoolCourses(id, body.courses);
    const updated = await getSchoolCourses(id);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
