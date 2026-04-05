import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Find the user to check provider
  const { data } = await supabase.auth.admin.listUsers();
  const user = data?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }

  const providers = user.app_metadata?.providers || [];
  if (providers.includes("google") && !providers.includes("email")) {
    return NextResponse.json({ error: "המשתמש מחובר דרך Google בלבד — אין צורך באיפוס סיסמה" }, { status: 400 });
  }

  // Send password reset email
  const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.bldr.co.il"}/auth/callback?type=recovery`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
