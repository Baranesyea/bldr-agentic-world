import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/schema";
import { asc } from "drizzle-orm";

export async function getCalendarEvents() {
  return db.select().from(calendarEvents).orderBy(asc(calendarEvents.startTime));
}
