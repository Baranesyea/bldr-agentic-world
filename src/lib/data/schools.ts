import { db } from "@/lib/db";
import { schools, schoolMemberships, schoolCourses, users } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import postgres from "postgres";

/**
 * Ensure a user exists in the Drizzle `users` table by syncing from Supabase `profiles`.
 * Needed because school_memberships FK references users.id.
 */
async function ensureUserExists(userId: string) {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (existing) return;
  // Copy from profiles
  const sql = postgres(process.env.DATABASE_URL!);
  const [profile] = await sql`SELECT id, email, full_name FROM profiles WHERE id = ${userId}`;
  await sql.end();
  if (profile) {
    await db.insert(users).values({
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name || profile.email.split("@")[0],
      passwordHash: "oauth",
      role: "member",
    }).onConflictDoNothing();
  }
}

// ============================================
// Schools CRUD
// ============================================

export async function getAllSchools() {
  return db.select().from(schools).orderBy(desc(schools.createdAt));
}

export async function getSchoolById(id: string) {
  const [school] = await db.select().from(schools).where(eq(schools.id, id));
  return school ?? null;
}

export async function createSchool(data: {
  name: string;
  slug?: string;
  logoUrl?: string;
  whatsappLink?: string;
  settings?: Record<string, unknown>;
}) {
  const slug = data.slug || data.name.trim().replace(/\s+/g, "-").toLowerCase();
  const [school] = await db
    .insert(schools)
    .values({ ...data, slug })
    .returning();
  return school;
}

export async function updateSchool(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    logoUrl: string;
    whatsappLink: string;
    settings: Record<string, unknown>;
  }>
) {
  const [school] = await db
    .update(schools)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schools.id, id))
    .returning();
  return school;
}

export async function deleteSchool(id: string) {
  await db.delete(schools).where(eq(schools.id, id));
}

// ============================================
// School Memberships
// ============================================

export async function getSchoolMembers(schoolId: string) {
  return db
    .select({
      membership: schoolMemberships,
      user: users,
    })
    .from(schoolMemberships)
    .innerJoin(users, eq(schoolMemberships.userId, users.id))
    .where(eq(schoolMemberships.schoolId, schoolId));
}

export async function getUserSchools(userId: string) {
  return db
    .select({
      membership: schoolMemberships,
      school: schools,
    })
    .from(schoolMemberships)
    .innerJoin(schools, eq(schoolMemberships.schoolId, schools.id))
    .where(eq(schoolMemberships.userId, userId));
}

export async function addMemberToSchool(data: {
  userId: string;
  schoolId: string;
  role?: string;
  accessExpiresAt?: Date | null;
  expiryMode?: "full_lock" | "partial_lock";
}) {
  await ensureUserExists(data.userId);
  const [membership] = await db
    .insert(schoolMemberships)
    .values({
      userId: data.userId,
      schoolId: data.schoolId,
      role: data.role ?? "student",
      accessExpiresAt: data.accessExpiresAt ?? null,
      expiryMode: data.expiryMode ?? "full_lock",
    })
    .onConflictDoUpdate({
      target: [schoolMemberships.userId, schoolMemberships.schoolId],
      set: {
        role: data.role ?? "student",
        accessExpiresAt: data.accessExpiresAt ?? null,
        expiryMode: data.expiryMode ?? "full_lock",
      },
    })
    .returning();
  return membership;
}

export async function removeMemberFromSchool(userId: string, schoolId: string) {
  await db
    .delete(schoolMemberships)
    .where(
      and(
        eq(schoolMemberships.userId, userId),
        eq(schoolMemberships.schoolId, schoolId)
      )
    );
}

// ============================================
// School Courses
// ============================================

export async function getSchoolCourses(schoolId: string) {
  return db
    .select()
    .from(schoolCourses)
    .where(eq(schoolCourses.schoolId, schoolId));
}

export async function setSchoolCourseAvailability(
  schoolId: string,
  courseId: string,
  isAvailable: boolean,
  availableAfterExpiry = false
) {
  const [row] = await db
    .insert(schoolCourses)
    .values({ schoolId, courseId, isAvailable, availableAfterExpiry })
    .onConflictDoUpdate({
      target: [schoolCourses.schoolId, schoolCourses.courseId],
      set: { isAvailable, availableAfterExpiry },
    })
    .returning();
  return row;
}

export async function bulkSetSchoolCourses(
  schoolId: string,
  courseSettings: { courseId: string; isAvailable: boolean; availableAfterExpiry?: boolean }[]
) {
  for (const cs of courseSettings) {
    await setSchoolCourseAvailability(
      schoolId,
      cs.courseId,
      cs.isAvailable,
      cs.availableAfterExpiry ?? false
    );
  }
}

// ============================================
// Active School
// ============================================

export async function setActiveSchool(userId: string, schoolId: string | null) {
  await db
    .update(users)
    .set({ activeSchoolId: schoolId, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
