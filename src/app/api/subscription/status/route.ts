import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { members } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { daysBetween } from "@/lib/billing";

export async function GET() {
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
    return NextResponse.json({ status: null });
  }

  const email = user.email.toLowerCase().trim();
  const [member] = await db.select().from(members).where(eq(members.email, email));
  if (!member) return NextResponse.json({ status: null });

  return NextResponse.json({
    email: member.email,
    fullName: member.fullName,
    billingCycle: member.billingCycle,
    priceAmount: member.pricePaid ?? 0,
    subscriptionStartedAt: member.subscriptionStartedAt,
    cancellationRequestedAt: member.cancellationRequestedAt,
    cancellationEffectiveAt: member.cancellationEffectiveAt,
    daysRemaining: member.cancellationEffectiveAt
      ? daysBetween(new Date(), new Date(member.cancellationEffectiveAt))
      : null,
  });
}
