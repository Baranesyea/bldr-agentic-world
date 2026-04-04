import { db } from "@/lib/db";
import { userCourseAccess, schoolCourses, schoolMemberships, courses, users } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";
import postgres from "postgres";

async function ensureUserExists(userId: string) {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (existing) return;
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
// Per-user course access overrides
// ============================================

export async function getUserCourseAccessList(userId: string, schoolId?: string | null) {
  const conditions = [eq(userCourseAccess.userId, userId)];
  if (schoolId) {
    conditions.push(eq(userCourseAccess.schoolId, schoolId));
  }
  return db
    .select()
    .from(userCourseAccess)
    .where(and(...conditions));
}

export async function setUserCourseAccess(
  userId: string,
  courseId: string,
  isAvailable: boolean,
  schoolId?: string | null
) {
  await ensureUserExists(userId);
  const [row] = await db
    .insert(userCourseAccess)
    .values({
      userId,
      courseId,
      schoolId: schoolId ?? null,
      isAvailable,
    })
    .onConflictDoUpdate({
      target: [userCourseAccess.userId, userCourseAccess.courseId, userCourseAccess.schoolId],
      set: { isAvailable },
    })
    .returning();
  return row;
}

export async function bulkSetUserCourseAccess(
  userId: string,
  courseSettings: { courseId: string; isAvailable: boolean }[],
  schoolId?: string | null
) {
  for (const cs of courseSettings) {
    await setUserCourseAccess(userId, cs.courseId, cs.isAvailable, schoolId);
  }
}

// ============================================
// Access Resolution
// ============================================

export interface AccessCheckResult {
  expired: boolean;
  expiryMode: "full_lock" | "partial_lock" | null;
  expiresAt: Date | null;
  availableCourseIds: string[];
  allCourseIds: string[];
}

/**
 * Resolve which courses are available for a user in a specific school context.
 * Resolution order:
 * 1. userCourseAccess (per-user override) → if exists, use isAvailable
 * 2. schoolCourses (school-level) → if exists, use isAvailable
 * 3. Default: available
 */
export async function checkUserAccess(
  userId: string,
  schoolId?: string | null
): Promise<AccessCheckResult> {
  // Get all courses
  const allCoursesRows = await db
    .select({ id: courses.id })
    .from(courses)
    .orderBy(asc(courses.displayOrder));
  const allCourseIds = allCoursesRows.map((c) => c.id);

  // Check expiry from school membership
  let expired = false;
  let expiryMode: "full_lock" | "partial_lock" | null = null;
  let expiresAt: Date | null = null;

  if (schoolId) {
    const [membership] = await db
      .select()
      .from(schoolMemberships)
      .where(
        and(
          eq(schoolMemberships.userId, userId),
          eq(schoolMemberships.schoolId, schoolId)
        )
      );

    if (membership?.accessExpiresAt) {
      expiresAt = membership.accessExpiresAt;
      if (new Date() > membership.accessExpiresAt) {
        expired = true;
        expiryMode = membership.expiryMode;
      }
    }
  }

  // If fully expired, no courses available
  if (expired && expiryMode === "full_lock") {
    return { expired, expiryMode, expiresAt, availableCourseIds: [], allCourseIds };
  }

  // Get user-level overrides
  const userOverrides = await getUserCourseAccessList(userId, schoolId);
  const userOverrideMap = new Map(
    userOverrides.map((o) => [o.courseId, o.isAvailable])
  );

  // Get school-level settings
  let schoolCourseMap = new Map<string, { isAvailable: boolean; availableAfterExpiry: boolean }>();
  if (schoolId) {
    const schoolCourseRows = await db
      .select()
      .from(schoolCourses)
      .where(eq(schoolCourses.schoolId, schoolId));
    schoolCourseMap = new Map(
      schoolCourseRows.map((sc) => [
        sc.courseId,
        { isAvailable: sc.isAvailable, availableAfterExpiry: sc.availableAfterExpiry },
      ])
    );
  }

  // Resolve availability for each course
  const availableCourseIds: string[] = [];

  for (const courseId of allCourseIds) {
    // 1. User override
    if (userOverrideMap.has(courseId)) {
      if (userOverrideMap.get(courseId)) availableCourseIds.push(courseId);
      continue;
    }

    // 2. School-level
    if (schoolCourseMap.has(courseId)) {
      const sc = schoolCourseMap.get(courseId)!;
      if (expired && expiryMode === "partial_lock") {
        // After partial expiry, only courses marked availableAfterExpiry remain
        if (sc.availableAfterExpiry) availableCourseIds.push(courseId);
      } else {
        if (sc.isAvailable) availableCourseIds.push(courseId);
      }
      continue;
    }

    // 3. Default: available (unless partially expired with no school course entry)
    if (expired && expiryMode === "partial_lock") {
      // No school course record = not explicitly available after expiry
      continue;
    }
    availableCourseIds.push(courseId);
  }

  return { expired, expiryMode, expiresAt, availableCourseIds, allCourseIds };
}
