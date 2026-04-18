import { db } from "@/lib/db";
import { emailTemplates, notificationLogs, members } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sendWhatsappMessage } from "@/lib/green-api";

function fill(template: string, variables: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(variables)) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
    out = out.replace(new RegExp(`\\{${key}\\}`, "g"), value ?? "");
  }
  return out;
}

export interface SendResult {
  email: { sent: boolean; error?: string; id?: string };
  whatsapp: { sent: boolean; error?: string; id?: string };
}

export async function sendTemplateEmail(
  toEmail: string,
  templateSlug: string,
  variables: Record<string, string>
): Promise<{ ok: boolean; error?: string; resendId?: string; subject?: string; html?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { ok: false, error: "RESEND_API_KEY missing" };

  const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.slug, templateSlug));
  if (!template) return { ok: false, error: `Template ${templateSlug} not found` };

  const subject = fill(template.subject, variables);
  const html = fill(template.bodyHtml, variables);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "BLDR <hello@bldr.co.il>",
        to: [toEmail],
        subject,
        html,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${JSON.stringify(data)}` };
    return { ok: true, resendId: data.id, subject, html };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function sendTemplateWhatsapp(
  toPhone: string,
  templateSlug: string,
  variables: Record<string, string>
) {
  const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.slug, templateSlug));
  if (!template) return { ok: false as const, error: `Template ${templateSlug} not found` };
  if (!template.whatsappBody) return { ok: false as const, error: `Template ${templateSlug} has no WhatsApp body` };

  const body = fill(template.whatsappBody, variables);
  return sendWhatsappMessage(toPhone, body);
}

export async function sendPasswordLinkNotifications(params: {
  email: string;
  phone?: string | null;
  fullName: string;
  setPasswordUrl: string;
  templateSlug: string;
}): Promise<SendResult> {
  const variables = {
    name: params.fullName,
    fullName: params.fullName,
    email: params.email,
    setPasswordUrl: params.setPasswordUrl,
    loginUrl: params.setPasswordUrl,
  };

  const emailResult = await sendTemplateEmail(params.email, params.templateSlug, variables);
  await db.insert(notificationLogs).values({
    toEmail: params.email,
    channel: "email",
    templateSlug: params.templateSlug,
    status: emailResult.ok ? "sent" : "failed",
    externalId: emailResult.resendId ?? null,
    error: emailResult.error ?? null,
    metadata: { variables },
  });

  let whatsappResult: { ok: boolean; error?: string; messageId?: string } = {
    ok: false,
    error: "no phone",
  };
  if (params.phone) {
    whatsappResult = await sendTemplateWhatsapp(params.phone, params.templateSlug, variables);
    await db.insert(notificationLogs).values({
      toPhone: params.phone,
      toEmail: params.email,
      channel: "whatsapp",
      templateSlug: params.templateSlug,
      status: whatsappResult.ok ? "sent" : "failed",
      externalId: whatsappResult.messageId ?? null,
      error: whatsappResult.error ?? null,
      metadata: { variables },
    });
  }

  await db
    .update(members)
    .set({
      lastPasswordLinkSentAt: new Date(),
      lastPasswordLinkEmailStatus: emailResult.ok ? "sent" : "failed",
      lastPasswordLinkWhatsappStatus: params.phone ? (whatsappResult.ok ? "sent" : "failed") : "skipped",
      updatedAt: new Date(),
    })
    .where(eq(members.email, params.email.toLowerCase().trim()));

  return {
    email: { sent: emailResult.ok, error: emailResult.error, id: emailResult.resendId },
    whatsapp: { sent: whatsappResult.ok, error: whatsappResult.error, id: whatsappResult.messageId },
  };
}
