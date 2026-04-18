import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { members } from "@/lib/schema";
import { eq } from "drizzle-orm";

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
  if (!member.cancellationRequestedAt) {
    return NextResponse.json({ error: "No cancellation to undo" }, { status: 400 });
  }

  await db
    .update(members)
    .set({
      cancellationRequestedAt: null,
      cancellationEffectiveAt: null,
      updatedAt: new Date(),
    })
    .where(eq(members.email, email));

  return NextResponse.json({ ok: true });
}
