import { NextRequest, NextResponse } from "next/server";
import { getSchoolMembers, addMemberToSchool, removeMemberFromSchool } from "@/lib/data/schools";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const members = await getSchoolMembers(id);
    return NextResponse.json(members);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === "remove") {
      await removeMemberFromSchool(body.userId, id);
      return NextResponse.json({ ok: true });
    }

    const { userId, role, accessExpiresAt, expiryMode } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    const membership = await addMemberToSchool({
      userId,
      schoolId: id,
      role,
      accessExpiresAt: accessExpiresAt ? new Date(accessExpiresAt) : null,
      expiryMode,
    });
    return NextResponse.json(membership, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
