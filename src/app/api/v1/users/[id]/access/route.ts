import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, members } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireApiKey } from "@/lib/api-auth";
import { addMemberToSchool, removeMemberFromSchool } from "@/lib/data/schools";
import { bulkSetUserCourseAccess } from "@/lib/data/user-course-access";

type ExpiryMode = "full_lock" | "partial_lock";

interface GrantAccessBody {
  schoolId?: string;
  courseIds?: string[];
  removeSchool?: boolean;
  courseAccess?: { courseId: string; isAvailable: boolean }[];
  accessExpiresAt?: string | null;
  expiryMode?: ExpiryMode;
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  const { id } = await params;
  const key = decodeURIComponent(id).toLowerCase().trim();

  let body: GrantAccessBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.expiryMode && body.expiryMode !== "full_lock" && body.expiryMode !== "partial_lock") {
    return NextResponse.json({ error: "expiryMode must be full_lock or partial_lock" }, { status: 400 });
  }

  const whereClause = isUuid(key) ? eq(users.id, key) : eq(users.email, key);
  const [user] = await db.select().from(users).where(whereClause);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const accessExpiresAt =
    body.accessExpiresAt === null
      ? null
      : body.accessExpiresAt
        ? new Date(body.accessExpiresAt)
        : undefined;
  if (accessExpiresAt instanceof Date && isNaN(accessExpiresAt.getTime())) {
    return NextResponse.json({ error: "accessExpiresAt must be a valid ISO date or null" }, { status: 400 });
  }
  const expiryMode: ExpiryMode = body.expiryMode ?? "full_lock";

  if (body.removeSchool && body.schoolId) {
    await removeMemberFromSchool(user.id, body.schoolId);
  } else if (body.schoolId) {
    await addMemberToSchool({
      userId: user.id,
      schoolId: body.schoolId,
      accessExpiresAt: accessExpiresAt === undefined ? null : accessExpiresAt,
      expiryMode,
    });

    await db
      .update(members)
      .set({
        schoolId: body.schoolId,
        ...(accessExpiresAt !== undefined ? { accessExpiresAt } : {}),
        expiryMode,
        updatedAt: new Date(),
      })
      .where(eq(members.email, user.email));
  }

  if (body.courseIds && body.courseIds.length > 0) {
    await bulkSetUserCourseAccess(
      user.id,
      body.courseIds.map((courseId) => ({ courseId, isAvailable: true })),
      body.schoolId ?? null
    );
  }

  if (body.courseAccess && body.courseAccess.length > 0) {
    await bulkSetUserCourseAccess(user.id, body.courseAccess, body.schoolId ?? null);
  }

  return NextResponse.json({ ok: true, userId: user.id });
}
