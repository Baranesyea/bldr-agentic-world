import { db } from "@/lib/db";
import { news } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function getNews() {
  return db.select().from(news).orderBy(desc(news.createdAt));
}
