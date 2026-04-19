import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { users, members } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireApiKey } from "@/lib/api-auth";
import { addMemberToSchool } from "@/lib/data/schools";
import { bulkSetUserCourseAccess } from "@/lib/data/user-course-access";
import { generatePasswordLink } from "@/lib/password-link";
import { sendPasswordLinkNotifications } from "@/lib/notify";
import { resolveTemplateSlug } from "@/lib/event-templates";
import { findAuthUserByEmail } from "@/lib/auth-admin";

type ExpiryMode = "full_lock" | "partial_lock";
type BillingCycle = "monthly" | "one_time";

interface CreateUserBody {
  email: string;
  fullName: string;
  password?: string;
  sendInvite?: boolean;
  phone?: string;
  schoolId?: string;
  courseIds?: string[];
  accessExpiresAt?: string;
  expiryMode?: ExpiryMode;
  role?: "member" | "admin" | "tourist";
  priceAmount?: number;
  billingCycle?: BillingCycle;
  subscriptionStartedAt?: string;
}

export async function POST(req: NextRequest) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
  }

  let body: CreateUserBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.email || !body.fullName) {
    return NextResponse.json({ error: "email and fullName are required" }, { status: 400 });
  }
  if (body.password && body.password.length < 6) {
    return NextResponse.json({ error: "password must be at least 6 characters" }, { status: 400 });
  }
  if (body.expiryMode && body.expiryMode !== "full_lock" && body.expiryMode !== "partial_lock") {
    return NextResponse.json({ error: "expiryMode must be full_lock or partial_lock" }, { status: 400 });
  }
  if (body.billingCycle && body.billingCycle !== "monthly" && body.billingCycle !== "one_time") {
    return NextResponse.json({ error: "billingCycle must be monthly or one_time" }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();
  const fullName = body.fullName.trim();
  const accessExpiresAt = body.accessExpiresAt ? new Date(body.accessExpiresAt) : null;
  if (accessExpiresAt && isNaN(accessExpiresAt.getTime())) {
    return NextResponse.json({ error: "accessExpiresAt must be a valid ISO date" }, { status: 400 });
  }
  const expiryMode: ExpiryMode = body.expiryMode ?? "full_lock";
  const billingCycle: BillingCycle = body.billingCycle ?? "one_time";
  const subscriptionStartedAt = body.subscriptionStartedAt
    ? new Date(body.subscriptionStartedAt)
    : new Date();
  if (isNaN(subscriptionStartedAt.getTime())) {
    return NextResponse.json({ error: "subscriptionStartedAt must be a valid ISO date" }, { status: 400 });
  }
  const priceAmount = typeof body.priceAmount === "number" ? body.priceAmount : 0;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const existingAuthUser = await findAuthUserByEmail(supabase, email);

  let authUserId: string;
  let created = false;
  const needsPasswordLink = !body.password;
  const seedPassword = body.password ?? crypto.randomUUID() + "Aa1!";

  if (existingAuthUser) {
    authUserId = existingAuthUser.id;
    if (body.password) {
      const { error } = await supabase.auth.admin.updateUserById(authUserId, {
        password: body.password,
        email_confirm: true,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: seedPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? "User creation failed" }, { status: 400 });
    }
    authUserId = data.user.id;
    created = true;
  }

  await db
    .insert(users)
    .values({
      id: authUserId,
      email,
      fullName,
      passwordHash: body.password ? "supabase" : "invite",
      role: body.role ?? "member",
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { email, fullName, updatedAt: new Date() },
    });

  const existingMember = await db.select().from(members).where(eq(members.email, email));
  if (existingMember.length > 0) {
    await db
      .update(members)
      .set({
        fullName,
        status: "active",
        supabaseUserId: authUserId,
        phone: body.phone ?? existingMember[0].phone,
        schoolId: body.schoolId ?? existingMember[0].schoolId,
        accessExpiresAt: accessExpiresAt ?? existingMember[0].accessExpiresAt,
        expiryMode,
        pricePaid: priceAmount || existingMember[0].pricePaid,
        billingCycle,
        type: billingCycle === "monthly" || priceAmount > 0 ? "paid" : existingMember[0].type,
        subscriptionStartedAt:
          body.subscriptionStartedAt || !existingMember[0].subscriptionStartedAt
            ? subscriptionStartedAt
            : existingMember[0].subscriptionStartedAt,
        updatedAt: new Date(),
      })
      .where(eq(members.email, email));
  } else {
    await db.insert(members).values({
      email,
      fullName,
      status: "active",
      type: billingCycle === "monthly" || priceAmount > 0 ? "paid" : "free",
      pricePaid: priceAmount,
      billingCycle,
      subscriptionStartedAt,
      phone: body.phone ?? null,
      supabaseUserId: authUserId,
      schoolId: body.schoolId ?? null,
      accessExpiresAt,
      expiryMode,
      notes: "api v1 create",
    });
  }

  if (body.schoolId) {
    await addMemberToSchool({
      userId: authUserId,
      schoolId: body.schoolId,
      accessExpiresAt,
      expiryMode,
    });
  }

  if (body.courseIds && body.courseIds.length > 0) {
    await bulkSetUserCourseAccess(
      authUserId,
      body.courseIds.map((courseId) => ({ courseId, isAvailable: true })),
      body.schoolId ?? null
    );
  }

  let setPasswordUrl: string | null = null;
  let notifications: { email: boolean; whatsapp: boolean; emailError?: string; whatsappError?: string } | null = null;

  if (needsPasswordLink) {
    const linkResult = await generatePasswordLink(email);
    if (linkResult.ok && linkResult.url) {
      setPasswordUrl = linkResult.url;
      try {
        const [emailSlug, whatsappSlug] = await Promise.all([
          resolveTemplateSlug("user_created", "email"),
          resolveTemplateSlug("user_created", "whatsapp"),
        ]);
        const sendResult = await sendPasswordLinkNotifications({
          email,
          phone: body.phone ?? null,
          fullName,
          setPasswordUrl,
          emailTemplateSlug: emailSlug,
          whatsappTemplateSlug: whatsappSlug,
        });
        notifications = {
          email: sendResult.email.sent,
          whatsapp: sendResult.whatsapp.sent,
          emailError: sendResult.email.error,
          whatsappError: sendResult.whatsapp.error,
        };
      } catch (err) {
        console.error("Notification send failed:", err);
      }
    }
  }

  return NextResponse.json(
    {
      user: {
        id: authUserId,
        email,
        fullName,
        role: body.role ?? "member",
        schoolId: body.schoolId ?? null,
        courseIds: body.courseIds ?? [],
        accessExpiresAt: accessExpiresAt?.toISOString() ?? null,
        expiryMode,
        priceAmount,
        billingCycle,
        subscriptionStartedAt: subscriptionStartedAt.toISOString(),
      },
      created,
      setPasswordUrl,
      notifications,
    },
    { status: created ? 201 : 200 }
  );
}
