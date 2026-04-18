import { db } from "@/lib/db";
import { adminSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export interface ServerWebhook {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  event: string;
  messageTemplate: string;
}

function fillTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

export async function loadServerWebhooks(): Promise<ServerWebhook[]> {
  const rows = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, "webhooks"));
  const value = rows[0]?.value as ServerWebhook[] | undefined;
  return Array.isArray(value) ? value : [];
}

export async function saveServerWebhooks(webhooks: ServerWebhook[]): Promise<void> {
  const existing = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, "webhooks"));
  if (existing.length > 0) {
    await db
      .update(adminSettings)
      .set({ value: webhooks, updatedAt: new Date() })
      .where(eq(adminSettings.key, "webhooks"));
  } else {
    await db.insert(adminSettings).values({ key: "webhooks", value: webhooks });
  }
}

export async function sendServerWebhook(
  eventType: string,
  variables: Record<string, string>
): Promise<void> {
  const webhooks = await loadServerWebhooks();
  const matching = webhooks.filter((w) => w.enabled && w.event === eventType && w.url);

  await Promise.all(
    matching.map(async (webhook) => {
      const message = fillTemplate(webhook.messageTemplate, variables);
      try {
        await fetch(webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message, event: eventType, variables }),
        });
      } catch (err) {
        console.error(`Webhook ${webhook.name} failed:`, err);
      }
    })
  );
}
