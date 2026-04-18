import { NextRequest, NextResponse } from "next/server";
import { loadServerWebhooks, saveServerWebhooks, ServerWebhook } from "@/lib/webhooks-server";

export async function GET() {
  const webhooks = await loadServerWebhooks();
  return NextResponse.json({ webhooks });
}

export async function PUT(req: NextRequest) {
  let body: { webhooks: ServerWebhook[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.webhooks)) {
    return NextResponse.json({ error: "webhooks must be an array" }, { status: 400 });
  }
  await saveServerWebhooks(body.webhooks);
  return NextResponse.json({ ok: true });
}
