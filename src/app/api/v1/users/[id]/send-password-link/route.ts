import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { members, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireApiKey } from "@/lib/api-auth";
import { generatePasswordLink } from "@/lib/password-link";
import { sendPasswordLinkNotifications } from "@/lib/notify";
import { resolveTemplateSlug } from "@/lib/event-templates";

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;
  const [me] = await db.select().from(users).where(eq(users.email, user.email.toLowerCase().trim()));
  return me?.role === "admin";
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    return await handle(req, ctx);
  } catch (err) {
    console.error("POST /api/v1/users/:id/send-password-link crashed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Internal server error", detail: message }, { status: 500 });
  }
}

async function handle(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const hasApiKey = !requireApiKey(req);
  const admin = hasApiKey ? true : await isAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const key = decodeURIComponent(id).toLowerCase().trim();

  const whereClause = isUuid(key) ? eq(users.id, key) : eq(users.email, key);
  const [user] = await db.select().from(users).where(whereClause);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [member] = await db.select().from(members).where(eq(members.email, user.email));

  const linkResult = await generatePasswordLink(user.email);
  if (!linkResult.ok || !linkResult.url) {
    return NextResponse.json({ error: linkResult.error ?? "Failed to generate link" }, { status: 500 });
  }

  const [emailSlug, whatsappSlug] = await Promise.all([
    resolveTemplateSlug("password_link_resend", "email"),
    resolveTemplateSlug("password_link_resend", "whatsapp"),
  ]);
  const sendResult = await sendPasswordLinkNotifications({
    email: user.email,
    phone: member?.phone ?? null,
    fullName: user.fullName,
    setPasswordUrl: linkResult.url,
    emailTemplateSlug: emailSlug,
    whatsappTemplateSlug: whatsappSlug,
  });

  return NextResponse.json({
    ok: true,
    setPasswordUrl: linkResult.url,
    notifications: {
      email: sendResult.email,
      whatsapp: sendResult.whatsapp,
    },
  });
}
