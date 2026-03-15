import { NextRequest, NextResponse } from "next/server";

const mockEvents = [
  {
    id: "e1",
    title: "Office Hours",
    description: "שעת קבלה פתוחה — שאלות, hot seat, ודיון פתוח",
    type: "office_hours",
    startTime: "2026-03-18T19:00:00+02:00",
    endTime: "2026-03-18T20:30:00+02:00",
    recordingUrl: null,
  },
  {
    id: "e2",
    title: "שיעור לייב: בניית סוכנים",
    description: "שיעור מעשי על בניית סוכני AI עם Claude Agent SDK",
    type: "live",
    startTime: "2026-03-25T19:00:00+02:00",
    endTime: "2026-03-25T21:00:00+02:00",
    recordingUrl: null,
  },
];

export async function GET() {
  return NextResponse.json({ events: mockEvents });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newEvent = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description || "",
    type: body.type || "live",
    startTime: body.startTime,
    endTime: body.endTime,
    recordingUrl: null,
  };
  return NextResponse.json({ event: newEvent }, { status: 201 });
}
