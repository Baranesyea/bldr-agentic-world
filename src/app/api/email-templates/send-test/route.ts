import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailTemplates, emailLogs } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { templateId, toEmail, variables } = await req.json();

    if (!templateId || !toEmail) {
      return NextResponse.json({ error: "Missing templateId or toEmail" }, { status: 400 });
    }

    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, templateId));
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Replace variables in subject and body
    let subject = template.subject;
    let html = template.bodyHtml;

    const vars = variables || {};
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      subject = subject.replace(regex, String(value));
      html = html.replace(regex, String(value));
    }

    // Send via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "BLDR <noreply@bldr.co.il>",
        to: [toEmail],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.message || "Failed to send" }, { status: 500 });
    }

    const resendData = await res.json();

    // Log the email
    try {
      await db.insert(emailLogs).values({
        resendId: resendData.id || null,
        toEmail,
        fromEmail: process.env.EMAIL_FROM || "BLDR <noreply@bldr.co.il>",
        subject,
        templateSlug: template.slug,
        status: "sent",
        metadata: { variables: vars, source: "admin_test" },
      });
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
