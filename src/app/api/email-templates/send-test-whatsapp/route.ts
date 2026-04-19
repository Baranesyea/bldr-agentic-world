import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailTemplates, notificationLogs } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sendWhatsappMessage } from "@/lib/green-api";

export async function POST(req: NextRequest) {
  try {
    const { templateId, toPhone, variables } = await req.json();
    if (!templateId || !toPhone) {
      return NextResponse.json({ error: "Missing templateId or toPhone" }, { status: 400 });
    }

    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, templateId));
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    if (!template.whatsappBody || !template.whatsappBody.trim()) {
      return NextResponse.json({ error: "No WhatsApp body defined for this template" }, { status: 400 });
    }

    let body = template.whatsappBody;
    const vars: Record<string, string> = variables || {};
    for (const [key, value] of Object.entries(vars)) {
      body = body.replace(new RegExp(`{{${key}}}`, "g"), String(value));
      body = body.replace(new RegExp(`{${key}}`, "g"), String(value));
    }

    const result = await sendWhatsappMessage(toPhone, body);

    await db.insert(notificationLogs).values({
      toPhone,
      channel: "whatsapp",
      templateSlug: template.slug,
      status: result.ok ? "sent" : "failed",
      externalId: result.messageId ?? null,
      error: result.error ?? null,
      metadata: { variables: vars, source: "admin_test" },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Failed to send WhatsApp" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
