import { NextRequest, NextResponse } from "next/server";
import { getAllSchools, createSchool } from "@/lib/data/schools";

export async function GET() {
  try {
    const all = await getAllSchools();
    return NextResponse.json(all);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, logoUrl, whatsappLink, settings } = body;
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const school = await createSchool({ name, slug, logoUrl, whatsappLink, settings });
    return NextResponse.json(school, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
