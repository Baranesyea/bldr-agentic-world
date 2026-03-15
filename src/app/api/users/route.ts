import { NextRequest, NextResponse } from "next/server";

// GET /api/users — List members (admin only)
export async function GET() {
  const mockUsers = [
    {
      id: "u1",
      fullName: "ערן בראון",
      email: "eran@example.com",
      role: "admin",
      avatarType: "uploaded",
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];
  return NextResponse.json({ users: mockUsers });
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
