import { db } from "@/lib/db";
import { adminSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export type EventKey =
  | "user_created"
  | "password_link_resend"
  | "password_reset_request"
  | "subscription_canceled";
export type Channel = "email" | "whatsapp";

export interface ChannelMap {
  email?: string;
  whatsapp?: string;
}

export type EventTemplateMap = Partial<Record<EventKey, ChannelMap | string>>;

const FALLBACK_SLUG = "welcome";

function coerce(entry: ChannelMap | string | undefined, channel: Channel): string | undefined {
  if (!entry) return undefined;
  if (typeof entry === "string") return entry;
  return entry[channel];
}

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

export async function resolveTemplateSlug(event: EventKey, channel: Channel): Promise<string> {
  const map = await loadEventTemplates();
  return coerce(map[event], channel) || FALLBACK_SLUG;
}
