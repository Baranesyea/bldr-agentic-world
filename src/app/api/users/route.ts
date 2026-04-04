import { NextRequest, NextResponse } from "next/server";

// GET /api/users — List users from profiles table (Supabase-managed)
export async function GET() {
  try {
    const postgres = (await import("postgres")).default;
    const sql = postgres(process.env.DATABASE_URL!);
    const allUsers = await sql`SELECT id, email, full_name, avatar_url, role, created_at FROM profiles ORDER BY created_at DESC`;
    await sql.end();
    return NextResponse.json({ users: allUsers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/users — Register new user
export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.email || !body.password || !body.fullName) {
    return NextResponse.json(
      { error: "Missing required fields: email, password, fullName" },
      { status: 400 }
    );
  }

  const newUser = {
    id: crypto.randomUUID(),
    fullName: body.fullName,
    email: body.email,
    role: "member",
    avatarType: "generated",
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ user: newUser }, { status: 201 });
}
