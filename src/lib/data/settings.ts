import { db } from "@/lib/db";
import { adminSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function getAdminSetting(key: string) {
  const [row] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, key));
  return row?.value ?? null;
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const rows = await db.select().from(adminSettings);
  const map: Record<string, unknown> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}
