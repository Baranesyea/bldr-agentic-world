import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, members, schoolMemberships, userCourseAccess } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireApiKey } from "@/lib/api-auth";

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  const { id } = await params;
  const key = decodeURIComponent(id).toLowerCase().trim();

  const whereClause = isUuid(key) ? eq(users.id, key) : eq(users.email, key);
  const [user] = await db.select().from(users).where(whereClause);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [member] = await db.select().from(members).where(eq(members.email, user.email));
  const schoolRows = await db.select().from(schoolMemberships).where(eq(schoolMemberships.userId, user.id));
  const courseAccess = await db.select().from(userCourseAccess).where(eq(userCourseAccess.userId, user.id));

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    },
    member: member
      ? {
          status: member.status,
          type: member.type,
          schoolId: member.schoolId,
          accessExpiresAt: member.accessExpiresAt,
          expiryMode: member.expiryMode,
        }
      : null,
    schools: schoolRows.map((s) => ({
      schoolId: s.schoolId,
      role: s.role,
      accessExpiresAt: s.accessExpiresAt,
      expiryMode: s.expiryMode,
    })),
    courseAccess: courseAccess.map((c) => ({
      courseId: c.courseId,
      schoolId: c.schoolId,
      isAvailable: c.isAvailable,
    })),
  });
}
