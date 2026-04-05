import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api", "/invite", "/watch", "/privacy", "/create-password", "/trial-expired", "/_next"];
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MEMBER_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function isPublicPath(pathname: string): boolean {
  return pathname === "/" || PUBLIC_PATHS.some(p => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in and trying to access platform pages, redirect to login
  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    // Enforce 24h session expiry
    const sessionStart = request.cookies.get("bldr_session_start")?.value;
    const now = Date.now();
    if (sessionStart) {
      const elapsed = now - Number(sessionStart);
      if (elapsed > SESSION_MAX_AGE_MS) {
        // Session expired - sign out and redirect
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("reason", "session_expired");
        const redirectResponse = NextResponse.redirect(url);
        redirectResponse.cookies.delete("bldr_session_start");
        redirectResponse.cookies.delete("bldr_member_check");
        // Clear supabase cookies
        request.cookies.getAll().forEach(c => {
          if (c.name.startsWith("sb-")) redirectResponse.cookies.delete(c.name);
        });
        return redirectResponse;
      }
    } else {
      // First request in this session - set the session start cookie
      supabaseResponse.cookies.set("bldr_session_start", String(now), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24h
      });
    }

    // Check member status (cached for 5 minutes to avoid DB hit on every request)
    if (!isPublicPath(request.nextUrl.pathname)) {
      const lastCheck = request.cookies.get("bldr_member_check")?.value;
      const needsCheck = !lastCheck || (now - Number(lastCheck)) > MEMBER_CHECK_INTERVAL_MS;

      if (needsCheck && user.email) {
        const { data: member } = await supabase
          .from("members")
          .select("status")
          .eq("email", user.email.toLowerCase().trim())
          .single();

        if (!member || member.status !== "active") {
          // Member is inactive/deleted - force sign out
          await supabase.auth.signOut();
          const url = request.nextUrl.clone();
          url.pathname = "/login";
          url.searchParams.set("reason", "account_deleted");
          const redirectResponse = NextResponse.redirect(url);
          redirectResponse.cookies.delete("bldr_session_start");
          redirectResponse.cookies.delete("bldr_member_check");
          request.cookies.getAll().forEach(c => {
            if (c.name.startsWith("sb-")) redirectResponse.cookies.delete(c.name);
          });
          return redirectResponse;
        }

        // Cache the check result
        supabaseResponse.cookies.set("bldr_member_check", String(now), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 300, // 5 min
        });
      }
    }

    // If logged in and on login page, redirect to dashboard
    if (request.nextUrl.pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|otf|ttf|woff|woff2)$).*)",
  ],
};
