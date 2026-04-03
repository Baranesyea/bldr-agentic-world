import { NextRequest, NextResponse } from "next/server";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  duplicateCourse,
  updateCourseOrder,
} from "@/lib/data/courses";

export async function GET() {
  try {
    const courses = await getCourses();
    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle special actions
    if (body.action === "duplicate") {
      const course = await duplicateCourse(body.id);
      if (!course)
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        );
      return NextResponse.json({ course }, { status: 201 });
    }

    if (body.action === "reorder") {
      await updateCourseOrder(body.courseIds);
      return NextResponse.json({ success: true });
    }

    const course = await createCourse(body);
    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to create course:", message, error);
    return NextResponse.json(
      { error: `Failed to create course: ${message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing course id" }, { status: 400 });
    }
    const course = await updateCourse(id, data);
    return NextResponse.json({ course });
  } catch (error) {
    console.error("Failed to update course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing course id" }, { status: 400 });
    }
    await deleteCourse(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
