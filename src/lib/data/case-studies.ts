import { db } from "@/lib/db";
import { caseStudies } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function getCaseStudies() {
  return db.select().from(caseStudies).orderBy(desc(caseStudies.createdAt));
}
