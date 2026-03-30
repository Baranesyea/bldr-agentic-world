import { NextResponse } from "next/server";
import { getMemberByEmail, createMember } from "@/lib/data/members";

export async function POST() {
  try {
    const email = "eranbrownstain@gmail.com";
    const existing = await getMemberByEmail(email);
    if (existing) {
      return NextResponse.json({ message: "Already exists", member: existing });
    }
    const member = await createMember({
      email,
      fullName: "Eran Brownstain",
      status: "active",
      type: "free",
    });
    return NextResponse.json({ message: "Created", member });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
