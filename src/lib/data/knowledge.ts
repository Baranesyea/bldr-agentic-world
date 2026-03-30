import { db } from "@/lib/db";
import { knowledgeBase } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function getKnowledgeBase() {
  return db.select().from(knowledgeBase).orderBy(desc(knowledgeBase.createdAt));
}
