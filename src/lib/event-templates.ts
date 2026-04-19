import { db } from "@/lib/db";
import { adminSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export type EventKey = "user_created" | "password_link_resend" | "subscription_canceled";

export interface EventTemplateMap {
  user_created?: string;
  password_link_resend?: string;
  subscription_canceled?: string;
}

const FALLBACKS: Record<EventKey, string> = {
  user_created: "welcome",
  password_link_resend: "welcome",
  subscription_canceled: "welcome",
};

export async function loadEventTemplates(): Promise<EventTemplateMap> {
  const [row] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, "event_templates"));
  return (row?.value as EventTemplateMap) ?? {};
}

export async function saveEventTemplates(map: EventTemplateMap): Promise<void> {
  const [existing] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, "event_templates"));
  if (existing) {
    await db
      .update(adminSettings)
      .set({ value: map, updatedAt: new Date() })
      .where(eq(adminSettings.key, "event_templates"));
  } else {
    await db.insert(adminSettings).values({ key: "event_templates", value: map });
  }
}

export async function resolveTemplateSlug(event: EventKey): Promise<string> {
  const map = await loadEventTemplates();
  return map[event] || FALLBACKS[event];
}
