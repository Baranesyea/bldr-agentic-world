import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getMemberByEmail } from "@/lib/data/members";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  // Recovery and invite flows → set password
  const isPasswordFlow = type === "recovery" || type === "invite";
  const redirectTo = isPasswordFlow ? `${origin}/reset-password` : `${origin}/dashboard`;

  const response = NextResponse.redirect(redirectTo);

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // For non-password flows (e.g. Google login), check member access
    if (!isPasswordFlow && data?.session?.user?.email) {
      const member = await getMemberByEmail(data.session.user.email);
      if (!member || member.status !== "active") {
        await supabase.auth.signOut();
        const loginUrl = new URL("/login", origin);
        loginUrl.searchParams.set("error", "no_access");
        return NextResponse.redirect(loginUrl.toString());
      }
    }
  }

  return response;
}
