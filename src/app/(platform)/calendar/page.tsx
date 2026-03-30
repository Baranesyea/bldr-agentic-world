import { getCalendarEvents } from "@/lib/data/calendar";
import CalendarClient from "./calendar-client";

export default async function CalendarPage() {
  const dbEvents = await getCalendarEvents();

  // Transform DB events to the shape the client expects
  const events = dbEvents.map((ev) => {
    const start = new Date(ev.startTime);
    const end = new Date(ev.endTime);
    // Map DB event_type enum to client EventType
    let clientType: "live_lesson" | "office_hours" | "deadline" | "community" | "other" = "other";
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
  });

  return <CalendarClient initialEvents={events} />;
}
