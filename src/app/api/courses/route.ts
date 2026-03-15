import { NextRequest, NextResponse } from "next/server";

// Mock data until DB is connected
const mockCourses = [
  {
    id: "1",
    title: "Mastering Claude Code",
    description: "למד לבנות עם Claude Code — מ-CLAUDE.md ועד סוכנים מלאים.",
    status: "active",
    dripEnabled: true,
    totalLessons: 24,
    totalChapters: 3,
  },
  {
    id: "2",
    title: "Vibe Coding Fundamentals",
    description: "בנה אפליקציות מלאות בלי לכתוב שורת קוד.",
    status: "active",
    dripEnabled: false,
    totalLessons: 18,
    totalChapters: 4,
  },
];

export async function GET() {
  return NextResponse.json({ courses: mockCourses });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newCourse = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description || "",
    status: "draft",
    dripEnabled: false,
    totalLessons: 0,
    totalChapters: 0,
  };
  return NextResponse.json({ course: newCourse }, { status: 201 });
}
