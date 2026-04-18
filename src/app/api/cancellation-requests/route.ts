import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { members, users } from "@/lib/schema";
import { isNotNull, desc, eq } from "drizzle-orm";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [me] = await db.select().from(users).where(eq(users.email, user.email.toLowerCase().trim()));
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db
    .select()
    .from(members)
    .where(isNotNull(members.cancellationRequestedAt))
    .orderBy(desc(members.cancellationRequestedAt));

  return NextResponse.json({
    requests: rows.map((m) => ({
      id: m.id,
      email: m.email,
      fullName: m.fullName,
      phone: m.phone,
      priceAmount: m.pricePaid,
      billingCycle: m.billingCycle,
      subscriptionStartedAt: m.subscriptionStartedAt,
      cancellationRequestedAt: m.cancellationRequestedAt,
      cancellationEffectiveAt: m.cancellationEffectiveAt,
    })),
  });
}
