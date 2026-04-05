import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { news } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

const MAX_NEWS = 10;

/**
 * GET /api/news
 * Returns the latest 10 news items from the database
 */
export async function GET() {
  try {
    const items = await db
      .select()
      .from(news)
      .orderBy(desc(news.createdAt))
      .limit(MAX_NEWS);

    // Map DB fields to API format
    return NextResponse.json(
      items.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.body || "",
        imageUrl: n.imageUrl,
        createdAt: n.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("News GET error:", err);
    return NextResponse.json([], { status: 200 });
  }
}

/**
 * POST /api/news
 * Add a new news item. Body: { title, description } or array
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];

    for (const item of items) {
      if (!item.title || !item.description) {
        return NextResponse.json(
          { error: "כל עדכון חייב לכלול title ו-description" },
          { status: 400 }
        );
      }

      await db.insert(news).values({
        title: item.title,
        body: item.description,
        imageUrl: item.imageUrl || item.url || null,
      });
    }

    const allNews = await db
      .select()
      .from(news)
      .orderBy(desc(news.createdAt))
      .limit(MAX_NEWS);

    return NextResponse.json({
      success: true,
      count: allNews.length,
      items: allNews.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.body || "",
        imageUrl: n.imageUrl,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("News POST error:", err);
    return NextResponse.json({ error: "שגיאה בשמירת חדשות" }, { status: 500 });
  }
}

/**
 * DELETE /api/news?id=xxx
 */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "חסר פרמטר id" }, { status: 400 });
  }
  try {
    await db.delete(news).where(eq(news.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("News DELETE error:", err);
    return NextResponse.json({ error: "שגיאה במחיקה" }, { status: 500 });
  }
}
