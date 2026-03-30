import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";

const EXPORT_DIR = path.join(process.cwd(), "exported-data");

export async function POST(req: NextRequest) {
  try {
    const { key, value, type } = await req.json();
    // type: "localStorage" | "indexedDB"
    const dir = path.join(EXPORT_DIR, type);
    await mkdir(dir, { recursive: true });

    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filePath = path.join(dir, `${safeKey}.json`);
    await writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");

    return NextResponse.json({ ok: true, saved: `${type}/${safeKey}.json` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { readdir } = await import("fs/promises");
    const types = ["localStorage", "indexedDB"];
    const result: Record<string, string[]> = {};
    for (const type of types) {
      const dir = path.join(EXPORT_DIR, type);
      try {
        result[type] = await readdir(dir);
      } catch {
        result[type] = [];
      }
    }
    return NextResponse.json({ ok: true, files: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
