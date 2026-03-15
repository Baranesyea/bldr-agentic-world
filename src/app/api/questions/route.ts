import { NextRequest, NextResponse } from "next/server";

const mockQuestions = [
  {
    id: "q1",
    userId: "u1",
    title: "איך להשתמש ב-MCP Servers?",
    description: "אני מנסה לחבר MCP Server ל-Claude Code אבל מקבל שגיאה...",
    mediaLink: "https://example.com/screenshot.png",
    status: "pending",
    tags: ["claude-code", "mcp"],
    createdAt: new Date().toISOString(),
  },
];

// GET /api/questions — List questions (supports ?status=pending)
export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const format = request.nextUrl.searchParams.get("format");

  let filtered = mockQuestions;
  if (status) {
    filtered = filtered.filter((q) => q.status === status);
  }

  // MD Export for agents
  if (format === "md") {
    const md = filtered
      .map(
        (q) =>
          `## [${q.id}] ${q.title}\n\n${q.description}\n\nMedia: ${q.mediaLink || "none"}\nTags: ${(q.tags as string[]).join(", ")}\nStatus: ${q.status}\n`
      )
      .join("\n---\n\n");
    return new NextResponse(md, {
      headers: { "Content-Type": "text/markdown" },
    });
  }

  return NextResponse.json({ questions: filtered });
}

// POST /api/questions — Create a new question
export async function POST(request: NextRequest) {
  const body = await request.json();
  const newQuestion = {
    id: crypto.randomUUID(),
    userId: body.userId,
    title: body.title,
    description: body.description,
    mediaLink: body.mediaLink || null,
    status: "pending",
    tags: body.tags || [],
    createdAt: new Date().toISOString(),
  };
  return NextResponse.json({ question: newQuestion }, { status: 201 });
}
