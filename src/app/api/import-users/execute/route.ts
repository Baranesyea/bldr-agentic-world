import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { members, importBatches } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { addMemberToSchool } from "@/lib/data/schools";
import { bulkSetUserCourseAccess } from "@/lib/data/user-course-access";
import { applyMapping, validateMapping } from "@/lib/user-import";
import type { FieldMapping } from "@/lib/user-import";
import { formatPhoneE164 } from "@/lib/format-phone";

async function getAnyUserId(): Promise<string | null> {
  try {
    const { users } = await import("@/lib/schema");
    const [user] = await db.select({ id: users.id }).from(users).limit(1);
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mappingJson = formData.get("mapping") as string;
    const schoolId = formData.get("schoolId") as string | null;
    const courseAvailabilityJson = formData.get("courseAvailability") as string;
    const accessExpiresAtStr = formData.get("accessExpiresAt") as string | null;
    const expiryMode = formData.get("expiryMode") as string | null;
    const importedBy = formData.get("importedBy") as string;
    const sendInvite = formData.get("sendInvite") !== "false";

    if (!file || !mappingJson) {
      return NextResponse.json(
        { error: "file and mapping are required" },
        { status: 400 }
      );
    }

    const mapping: FieldMapping = JSON.parse(mappingJson);
    const validation = validateMapping(mapping);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(", ") }, { status: 400 });
    }

    const courseAvailability: Record<string, boolean> = courseAvailabilityJson
      ? JSON.parse(courseAvailabilityJson)
      : {};
    const accessExpiresAt = accessExpiresAtStr ? new Date(accessExpiresAtStr) : null;

    const buffer = await file.arrayBuffer();
    const { users, skippedRows } = applyMapping(buffer, mapping);

    // Create import batch record
    const resolvedImportedBy = importedBy || await getAnyUserId();
    if (!resolvedImportedBy) {
      return NextResponse.json({ error: "No users found in system" }, { status: 400 });
    }

    const [batch] = await db
      .insert(importBatches)
      .values({
        schoolId: schoolId || null,
        importedBy: resolvedImportedBy,
        fileName: file.name,
        totalRows: users.length + skippedRows,
        fieldMapping: mapping,
        courseAvailability,
        accessExpiresAt,
        expiryMode: expiryMode as "full_lock" | "partial_lock" | null,
      })
      .returning();

    // Setup Supabase admin client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const supabase = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null;

    let successCount = 0;
    let failCount = 0;
    const errors: { email: string; error: string }[] = [];

    for (const user of users) {
      try {
        // Upsert member record
        const existing = await db
          .select()
          .from(members)
          .where(eq(members.email, user.email));

        let memberId: string;

        if (existing.length > 0) {
          // Update existing member
          const [updated] = await db
            .update(members)
            .set({
              fullName: user.fullName || existing[0].fullName,
              phone: formatPhoneE164(user.phone) || existing[0].phone,
              notes: user.notes || existing[0].notes,
              schoolId: schoolId || existing[0].schoolId,
              accessExpiresAt,
              expiryMode: (expiryMode as "full_lock" | "partial_lock") || existing[0].expiryMode,
              importBatchId: batch.id,
              updatedAt: new Date(),
            })
            .where(eq(members.id, existing[0].id))
            .returning();
          memberId = updated.id;
        } else {
          // Create new member
          const [created] = await db
            .insert(members)
            .values({
              email: user.email,
              fullName: user.fullName || user.email.split("@")[0],
              phone: formatPhoneE164(user.phone),
              status: (user.status as "active" | "inactive") || "active",
              type: (user.type as "free" | "paid") || "free",
              schoolId: schoolId || null,
              accessExpiresAt,
              expiryMode: (expiryMode as "full_lock" | "partial_lock") || "full_lock",
              importBatchId: batch.id,
            })
            .returning();
          memberId = created.id;

          // Invite via Supabase (send email) — only if sendInvite is true
          if (supabase && sendInvite) {
            await supabase.auth.admin.inviteUserByEmail(user.email, {
              data: { full_name: user.fullName || "" },
              redirectTo: `${appUrl}/auth/callback?type=invite`,
            });
          }
        }

        // Add to school if specified
        if (schoolId) {
          // We need the user's actual users table ID, not the member ID.
          // For now, use the supabaseUserId if available, otherwise skip school membership
          // (it will be created when user first logs in)
          const memberRow = existing.length > 0 ? existing[0] : null;
          if (memberRow?.supabaseUserId) {
            // Find corresponding users table entry
            const { users: usersTable } = await import("@/lib/schema");
            const [userRow] = await db
              .select()
              .from(usersTable)
              .where(eq(usersTable.email, user.email));
            if (userRow) {
              await addMemberToSchool({
                userId: userRow.id,
                schoolId,
                accessExpiresAt,
                expiryMode: (expiryMode as "full_lock" | "partial_lock") || "full_lock",
              });

              // Set course availability
              const blockedCourses = Object.entries(courseAvailability)
                .filter(([, available]) => !available)
                .map(([courseId]) => ({ courseId, isAvailable: false }));
              if (blockedCourses.length > 0) {
                await bulkSetUserCourseAccess(userRow.id, blockedCourses, schoolId);
              }
            }
          }
        }

        successCount++;
      } catch (err) {
        failCount++;
        errors.push({
          email: user.email,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // Update batch counts
    await db
      .update(importBatches)
      .set({ successCount, failCount: failCount + skippedRows })
      .where(eq(importBatches.id, batch.id));

    return NextResponse.json({
      batchId: batch.id,
      totalRows: users.length + skippedRows,
      successCount,
      failCount: failCount + skippedRows,
      errors: errors.slice(0, 20), // Return first 20 errors
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
