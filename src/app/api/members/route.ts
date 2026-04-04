import { NextRequest, NextResponse } from "next/server";
import { getAllMembers, createMember, updateMember, getMemberByEmail } from "@/lib/data/members";

export async function GET() {
  try {
    const all = await getAllMembers();
    return NextResponse.json(all);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName, type, pricePaid, notes } = body;
    if (!email || !fullName) {
      return NextResponse.json({ error: "email and fullName are required" }, { status: 400 });
    }
    // If member already exists (e.g. was deleted), reactivate instead of creating
    const existing = await getMemberByEmail(email);
    if (existing) {
      const reactivated = await updateMember(existing.id, {
        fullName,
        status: "active",
        type: type || existing.type,
        pricePaid: pricePaid ?? existing.pricePaid,
        notes: notes || existing.notes || "",
      });
      // Also restore profiles table
      try {
        const postgres = (await import("postgres")).default;
        const sql = postgres(process.env.DATABASE_URL!);
        await sql`UPDATE profiles SET full_name = ${fullName}, bio = NULL WHERE email = ${email.toLowerCase().trim()}`;
        await sql.end();
      } catch {}
      return NextResponse.json(reactivated);
    }
    const member = await createMember({
      email,
      fullName,
      type: type || "free",
      pricePaid: pricePaid || 0,
      notes: notes || "",
    });
    return NextResponse.json(member);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const member = await updateMember(id, data);
    return NextResponse.json(member);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
