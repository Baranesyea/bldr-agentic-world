import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminSettings, members } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    // Check if flogin is enabled
    const settingsRows = await db.select().from(adminSettings).where(eq(adminSettings.key, "flogin_settings"));
    const settings = (settingsRows[0]?.value as { enabled: boolean; accessDays: number }) || { enabled: false, accessDays: 7 };

    if (!settings.enabled) {
      return NextResponse.json({ error: "ההרשמה החופשית סגורה כרגע" }, { status: 403 });
    }

    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "כל השדות נדרשים" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 6 תווים" }, { status: 400 });
    }

    // Check if email exists in members table
    const existingMember = await db.select().from(members).where(eq(members.email, email.toLowerCase().trim()));
    if (existingMember.length === 0) {
      return NextResponse.json({ error: "המייל הזה לא נמצא במערכת. פנה למנהל לקבלת גישה." }, { status: 403 });
    }

    // Calculate access expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (settings.accessDays || 7));

    // Create Supabase auth user
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      // User already exists — update their password
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
      });
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    } else {
      // Create new auth user (no email confirmation required)
      const { error: authError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    }

    // Update member record with access expiry
    const memberRecord = await db.select().from(members).where(eq(members.email, email.toLowerCase().trim()));

    if (memberRecord.length > 0) {
      await db.update(members).set({
        fullName,
        status: "active",
        type: "free",
        accessExpiresAt: expiresAt,
        updatedAt: new Date(),
      }).where(eq(members.email, email.toLowerCase().trim()));
    } else {
      await db.insert(members).values({
        email: email.toLowerCase().trim(),
        fullName,
        status: "active",
        type: "free",
        pricePaid: 0,
        accessExpiresAt: expiresAt,
        notes: "flogin registration",
      });
    }

    // Send welcome email (best effort)
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const { emailTemplates, emailLogs } = await import("@/lib/schema");
        const templateRows = await db.select().from(emailTemplates).where(eq(emailTemplates.slug, "welcome"));
        if (templateRows.length > 0) {
          const template = templateRows[0];
          let subject = template.subject.replace(/\{\{name\}\}/g, fullName);
          let html = template.bodyHtml.replace(/\{\{name\}\}/g, fullName)
            .replace(/\{\{loginUrl\}\}/g, "https://app.bldr.co.il/login");

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || "BLDR <hello@bldr.co.il>",
              to: [email],
              subject,
              html,
            }),
          });

          if (res.ok) {
            const resendData = await res.json();
            await db.insert(emailLogs).values({
              resendId: resendData.id || null,
              toEmail: email,
              fromEmail: process.env.EMAIL_FROM || "BLDR <hello@bldr.co.il>",
              subject,
              templateSlug: "welcome",
              status: "sent",
              metadata: { source: "flogin" },
            });
          }
        }
      }
    } catch {}

    return NextResponse.json({
      ok: true,
      accessDays: settings.accessDays,
      expiresAt: expiresAt.toISOString(),
      debug: { userExisted: !!existingUser, email: email.toLowerCase().trim() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
