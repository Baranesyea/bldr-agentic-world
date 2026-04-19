import { NextRequest, NextResponse } from "next/server";
import { verifyPasswordLinkToken } from "@/lib/password-link-token";
import { generateSupabaseRecoveryLink } from "@/lib/password-link";

export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const payload = verifyPasswordLinkToken(body.token);
  if (!payload) {
    return NextResponse.json({ error: "הקישור לא תקין או פג תוקף" }, { status: 400 });
  }

  const supabaseLink = await generateSupabaseRecoveryLink(payload.email);
  if (!supabaseLink.ok || !supabaseLink.url) {
    return NextResponse.json({ error: supabaseLink.error || "לא ניתן לייצר קישור" }, { status: 500 });
  }

  return NextResponse.json({ url: supabaseLink.url });
}
