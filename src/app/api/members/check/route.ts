import { NextRequest, NextResponse } from "next/server";
import { getMemberByEmail } from "@/lib/data/members";

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ active: false, member: null });
    }
    const member = await getMemberByEmail(email);
    if (!member) {
      return NextResponse.json({ active: false, member: null });
    }
    return NextResponse.json({
      active: member.status === "active",
      member: {
        id: member.id,
        email: member.email,
        fullName: member.fullName,
        status: member.status,
        type: member.type,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, active: false, member: null }, { status: 500 });
  }
}
