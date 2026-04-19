import { NextRequest, NextResponse } from "next/server";
import { loadEventTemplates, saveEventTemplates, EventTemplateMap } from "@/lib/event-templates";

export async function GET() {
  const map = await loadEventTemplates();
  return NextResponse.json({ map });
}

export async function PUT(req: NextRequest) {
  let body: { map?: EventTemplateMap };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.map || typeof body.map !== "object") {
    return NextResponse.json({ error: "map is required" }, { status: 400 });
  }
  await saveEventTemplates(body.map);
  return NextResponse.json({ ok: true });
}
