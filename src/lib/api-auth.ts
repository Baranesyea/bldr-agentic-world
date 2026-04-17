import { NextResponse } from "next/server";

export function requireApiKey(req: Request): NextResponse | null {
  const configured = process.env.PUBLIC_API_KEY;
  if (!configured) {
    return NextResponse.json(
      { error: "PUBLIC_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }
  const provided = req.headers.get("x-api-key");
  if (!provided || provided !== configured) {
    return NextResponse.json({ error: "Invalid or missing x-api-key" }, { status: 401 });
  }
  return null;
}
