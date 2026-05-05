import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { members } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sendServerWebhook } from "@/lib/webhooks-server";

async function requireAuth() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email ? user : null;
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action } = await req.json();
  if (!id || !["complete", "uncomplete"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const [member] = await db.select().from(members).where(eq(members.id, id));
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();

  if (action === "complete") {
    await db
      .update(members)
      .set({ cancellationCompletedAt: now, updatedAt: now })
      .where(eq(members.id, id));

    const firstName = (member.fullName || "").split(" ")[0] || member.fullName || "";
    try {
      await sendServerWebhook("subscription.cancel_completed", {
        fullName: member.fullName,
        firstName,
        email: member.email,
        phone: member.phone ?? "",
        completedAt: now.toISOString(),
      });
    } catch (err) {
      console.error("cancel_completed webhook failed:", err);
    }
    return NextResponse.json({ ok: true, cancellationCompletedAt: now.toISOString() });
  }

  await db
    .update(members)
    .set({ cancellationCompletedAt: null, updatedAt: now })
    .where(eq(members.id, id));
  return NextResponse.json({ ok: true });
}
