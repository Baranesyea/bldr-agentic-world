import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { members } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { nextBillingAnniversary } from "@/lib/billing";
import { sendServerWebhook } from "@/lib/webhooks-server";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email.toLowerCase().trim();
  const [member] = await db.select().from(members).where(eq(members.email, email));
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (member.billingCycle !== "monthly") {
    return NextResponse.json({ error: "No recurring subscription to cancel" }, { status: 400 });
  }
  if (member.cancellationRequestedAt) {
    return NextResponse.json({ error: "Cancellation already requested" }, { status: 400 });
  }

  const now = new Date();
  const startedAt = member.subscriptionStartedAt ?? member.createdAt;
  const effectiveAt = nextBillingAnniversary(startedAt, now);

  await db
    .update(members)
    .set({
      cancellationRequestedAt: now,
      cancellationEffectiveAt: effectiveAt,
      updatedAt: now,
    })
    .where(eq(members.email, email));

  try {
    await sendServerWebhook("subscription.cancel_requested", {
      email: member.email,
      fullName: member.fullName,
      phone: member.phone ?? "",
      priceAmount: String(member.pricePaid ?? 0),
      billingCycle: "monthly",
      effectiveAt: effectiveAt.toISOString(),
      cancelledAt: now.toISOString(),
    });
  } catch (err) {
    console.error("Cancellation webhook failed:", err);
  }

  return NextResponse.json({
    ok: true,
    cancellationRequestedAt: now.toISOString(),
    cancellationEffectiveAt: effectiveAt.toISOString(),
  });
}
