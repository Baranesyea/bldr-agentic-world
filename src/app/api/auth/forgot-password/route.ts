import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generatePasswordLink } from "@/lib/password-link";
import { sendPasswordLinkNotifications } from "@/lib/notify";
import { resolveTemplateSlug } from "@/lib/event-templates";

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const email = body.email.toLowerCase().trim();

  const [member] = await db.select().from(members).where(eq(members.email, email));

  const linkResult = await generatePasswordLink(email);

  // Always respond ok so we don't expose whether the email exists, but only send
  // when we actually have a link and a member record — prevents spamming random addresses.
  if (linkResult.ok && linkResult.url && member) {
    const [emailSlug, whatsappSlug] = await Promise.all([
      resolveTemplateSlug("password_reset_request", "email"),
      resolveTemplateSlug("password_reset_request", "whatsapp"),
    ]);
    try {
      await sendPasswordLinkNotifications({
        email,
        phone: member.phone ?? null,
        fullName: member.fullName,
        setPasswordUrl: linkResult.url,
        generateExtraLink: async () => {
          const extra = await generatePasswordLink(email);
          return extra.ok && extra.url ? extra.url : null;
        },
        emailTemplateSlug: emailSlug,
        whatsappTemplateSlug: whatsappSlug,
      });
    } catch (err) {
      console.error("Forgot password send failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
