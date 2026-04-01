import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

function clientTypeToDb(type: string): "live" | "office_hours" | "brainstorm" {
  if (type === "live_lesson") return "live";
  if (type === "office_hours") return "office_hours";
  if (type === "community") return "brainstorm";
  return "live";
}

function buildTimestamp(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

function dbEventToClient(ev: typeof calendarEvents.$inferSelect) {
  const start = new Date(ev.startTime);
  const end = new Date(ev.endTime);
  let clientType: string = "other";
  if (ev.type === "live") clientType = "live_lesson";
  else if (ev.type === "office_hours") clientType = "office_hours";
  else if (ev.type === "brainstorm") clientType = "community";

  return {
    id: ev.id,
    title: ev.title,
    date: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
    startTime: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
    endTime: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
    type: clientType,
    description: ev.description || undefined,
  };
}

export async function GET() {
  const events = await db.select().from(calendarEvents).orderBy(asc(calendarEvents.startTime));
  return NextResponse.json(events.map(dbEventToClient));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, date, startTime, endTime, type, description } = body;

  const [created] = await db.insert(calendarEvents).values({
    title,
    description: description || null,
    type: clientTypeToDb(type),
    startTime: buildTimestamp(date, startTime),
    endTime: buildTimestamp(date, endTime),
  }).returning();

  revalidatePath("/calendar");
  return NextResponse.json(dbEventToClient(created));
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, title, date, startTime, endTime, type, description } = body;

  const [updated] = await db.update(calendarEvents)
    .set({
      title,
      description: description || null,
      type: clientTypeToDb(type),
      startTime: buildTimestamp(date, startTime),
      endTime: buildTimestamp(date, endTime),
    })
    .where(eq(calendarEvents.id, id))
    .returning();

  revalidatePath("/calendar");
  return NextResponse.json(dbEventToClient(updated));
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  revalidatePath("/calendar");
  return NextResponse.json({ success: true });
}
