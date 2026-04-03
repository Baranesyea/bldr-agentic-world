import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { dataUrl, fileName } = await request.json();

    if (!dataUrl) {
      return NextResponse.json({ error: "Missing dataUrl" }, { status: 400 });
    }

    // Parse data URL
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid data URL format" }, { status: 400 });
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
    const name = fileName || `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const filePath = `${name}.${ext}`;

    const { error } = await supabase.storage
      .from("images")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
