import { NextRequest, NextResponse } from "next/server";

const mockFeed = [
  {
    id: "1",
    type: "auto",
    trigger: "new_lesson",
    title: "שיעור חדש זמין",
    body: "איך לכתוב CLAUDE.md — קורס Mastering Claude Code",
    linkUrl: "/courses/1/lessons/l3",
    linkLabel: "לשיעור",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    type: "auto",
    trigger: "new_event",
    title: "אירוע חדש",
    body: "Office Hours — יום שלישי, 19:00",
    linkUrl: "/calendar",
    linkLabel: "לאירוע",
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({ items: mockFeed });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newItem = {
    id: crypto.randomUUID(),
    type: "manual",
    trigger: "custom",
    title: body.title,
    body: body.body,
    imageUrl: body.imageUrl || null,
    linkUrl: body.linkUrl || null,
    linkLabel: body.linkLabel || null,
    createdAt: new Date().toISOString(),
  };
  return NextResponse.json({ item: newItem }, { status: 201 });
}
