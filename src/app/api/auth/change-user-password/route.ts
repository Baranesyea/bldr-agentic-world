import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, newPassword } = await req.json();

  if (!email || !newPassword) {
    return NextResponse.json({ error: "email and newPassword required" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 6 תווים" }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Find user by email
  const { data } = await supabase.auth.admin.listUsers();
  const user = data?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }

  // Update password
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
