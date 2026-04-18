import { db } from "@/lib/db";
import { adminSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export interface GreenApiConfig {
  instanceId: string;
  apiToken: string;
  enabled: boolean;
}

export async function loadGreenApiConfig(): Promise<GreenApiConfig | null> {
  const [row] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, "green_api_config"));
  const value = row?.value as GreenApiConfig | undefined;
  if (!value || !value.instanceId || !value.apiToken || !value.enabled) return null;
  return value;
}

export async function saveGreenApiConfig(config: GreenApiConfig): Promise<void> {
  const [existing] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, "green_api_config"));
  if (existing) {
    await db
      .update(adminSettings)
      .set({ value: config, updatedAt: new Date() })
      .where(eq(adminSettings.key, "green_api_config"));
  } else {
    await db.insert(adminSettings).values({ key: "green_api_config", value: config });
  }
}

function normalizePhone(phone: string): string {
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("0")) p = "972" + p.slice(1);
  if (!p.startsWith("972") && p.length === 9) p = "972" + p;
  return `${p}@c.us`;
}

export interface SendWhatsappResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWhatsappMessage(
  phone: string,
  body: string
): Promise<SendWhatsappResult> {
  const config = await loadGreenApiConfig();
  if (!config) return { ok: false, error: "Green API not configured or disabled" };
  if (!phone) return { ok: false, error: "Phone number missing" };

  const chatId = normalizePhone(phone);
  const url = `https://api.green-api.com/waInstance${config.instanceId}/sendMessage/${config.apiToken}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message: body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${JSON.stringify(data)}` };
    return { ok: true, messageId: data.idMessage || data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}
