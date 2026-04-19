import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { findAuthUserByEmail } from "@/lib/auth-admin";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ provider: null });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const user = await findAuthUserByEmail(supabase, email);

  if (!user) {
    return NextResponse.json({ provider: null });
  }

  const providers = user.app_metadata?.providers || [];
  const hasPassword = providers.includes("email");
  const hasGoogle = providers.includes("google");

  if (hasGoogle && !hasPassword) {
    return NextResponse.json({ provider: "google_only" });
  }

  return NextResponse.json({ provider: "email" });
}
