import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let buffer: Buffer;
    let mimeType: string;
    let fileName: string;

    if (contentType.includes("multipart/form-data")) {
      // FormData upload (binary file)
      const formData = await request.formData();
      const file = formData.get("file") as File;
      fileName = (formData.get("fileName") as string) || `upload_${Date.now()}`;
      if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
      mimeType = file.type || "image/jpeg";
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // JSON upload (data URL)
      const { dataUrl, fileName: fn } = await request.json();
      fileName = fn || `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      if (!dataUrl) return NextResponse.json({ error: "Missing dataUrl" }, { status: 400 });
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return NextResponse.json({ error: "Invalid data URL format" }, { status: 400 });
      mimeType = match[1];
      buffer = Buffer.from(match[2], "base64");
    }

    const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : mimeType.includes("audio") ? "mp3" : "jpg";
    const filePath = `${fileName}.${ext}`;

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
