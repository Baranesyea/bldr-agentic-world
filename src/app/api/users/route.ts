import { NextRequest, NextResponse } from "next/server";

// GET /api/users — List users from DB
export async function GET() {
  try {
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/schema");
    const { desc } = await import("drizzle-orm");
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
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
