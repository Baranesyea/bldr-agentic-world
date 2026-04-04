import { NextRequest, NextResponse } from "next/server";
import { parseUserFile, autoDetectMapping } from "@/lib/user-import";

// POST: Upload file → return headers + preview + auto-detected mapping
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const preview = parseUserFile(buffer);

    if (preview.headers.length === 0) {
      return NextResponse.json({ error: "הקובץ ריק או בפורמט לא תקין" }, { status: 400 });
    }

    const suggestedMapping = autoDetectMapping(preview.headers);

    return NextResponse.json({
      headers: preview.headers,
      previewRows: preview.rows,
      totalRows: preview.totalRows,
      suggestedMapping,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
