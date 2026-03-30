import { db } from "@/lib/db";
import { members } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function getMemberByEmail(email: string) {
  const rows = await db
    .select()
    .from(members)
    .where(eq(members.email, email.toLowerCase().trim()));
  return rows[0] ?? null;
}

export async function getAllMembers() {
  return db.select().from(members).orderBy(desc(members.createdAt));
}

export async function createMember(data: {
  email: string;
  fullName: string;
  status?: "active" | "inactive";
  type?: "free" | "paid";
  pricePaid?: number;
  supabaseUserId?: string;
  notes?: string;
}) {
  const rows = await db
    .insert(members)
    .values({
      email: data.email.toLowerCase().trim(),
      fullName: data.fullName,
      status: data.status ?? "active",
      type: data.type ?? "free",
      pricePaid: data.pricePaid ?? 0,
      supabaseUserId: data.supabaseUserId,
      notes: data.notes,
    })
    .returning();
  return rows[0];
}

export async function updateMember(
  id: string,
  data: Partial<{
    fullName: string;
    status: "active" | "inactive";
    type: "free" | "paid";
    pricePaid: number;
    supabaseUserId: string;
    notes: string;
  }>
) {
  const rows = await db
    .update(members)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(members.id, id))
    .returning();
  return rows[0];
}

export async function deactivateMember(id: string) {
  return updateMember(id, { status: "inactive" });
}
