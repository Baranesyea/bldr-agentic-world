import { NextRequest, NextResponse } from "next/server";
import { checkUserAccess } from "@/lib/data/user-course-access";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    const schoolId = req.nextUrl.searchParams.get("schoolId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const result = await checkUserAccess(userId, schoolId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
