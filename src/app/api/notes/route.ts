import { NextRequest, NextResponse } from "next/server";

const mockNotes = [
  {
    id: "n1",
    userId: "u1",
    lessonId: "l6",
    content: "MCP Servers מאפשרים ל-Claude לגשת לכלים חיצוניים",
    videoTimestamp: "12:34",
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({ notes: mockNotes });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newNote = {
    id: crypto.randomUUID(),
    userId: body.userId,
    lessonId: body.lessonId || null,
    content: body.content,
    videoTimestamp: body.videoTimestamp || null,
    createdAt: new Date().toISOString(),
  };
  return NextResponse.json({ note: newNote }, { status: 201 });
}
