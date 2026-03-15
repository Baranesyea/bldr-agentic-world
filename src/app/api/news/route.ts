import { NextRequest, NextResponse } from "next/server";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  createdAt: string;
}

// In-memory store (persists during server lifetime)
let newsStore: NewsItem[] = [
  { id: "1", title: "Claude 4 שוחרר!", description: "הדור החדש של Claude הגיע עם יכולות מתקדמות — context window של מיליון טוקנים, כלים חדשים ועוד", icon: "sparkles", createdAt: new Date().toISOString() },
  { id: "2", title: "קורס חדש: Building AI Agents", description: "למד לבנות סוכני AI חכמים עם Claude Agent SDK. הקורס כולל 20 שיעורים ו-5 פרויקטים מעשיים", icon: "book", createdAt: new Date().toISOString() },
  { id: "3", title: "עדכון פלטפורמה", description: "הוספנו נגן וידאו מותאם, מערכת התראות חדשה ושיפורים בממשק הניהול", icon: "rocket", createdAt: new Date().toISOString() },
  { id: "4", title: "MCP Servers — מדריך מקיף", description: "פרסמנו מדריך מקיף על Model Context Protocol שמסביר איך לחבר כלים חיצוניים", icon: "layers", createdAt: new Date().toISOString() },
  { id: "5", title: "מיטאפ קהילתי — מרץ", description: "המיטאפ הקרוב יתקיים ב-28 למרץ בשעה 18:00. הנושא: אוטומציות חכמות לעסקים", icon: "calendar", createdAt: new Date().toISOString() },
];

const MAX_NEWS = 10;

/**
 * GET /api/news
 * Returns the latest 10 news items
 */
export async function GET() {
  return NextResponse.json(newsStore.slice(0, MAX_NEWS));
}

/**
 * POST /api/news
 * Add a new news item. Body: { title, description, icon? }
 * Keeps only the latest 10 items.
 *
 * Can also accept an array of items: [{ title, description, icon? }, ...]
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

      const newsItem: NewsItem = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title: item.title,
        description: item.description,
        icon: item.icon || "sparkles",
        createdAt: new Date().toISOString(),
      };

      newsStore.unshift(newsItem);
    }

    // Keep only latest 10
    newsStore = newsStore.slice(0, MAX_NEWS);

    return NextResponse.json({
      success: true,
      count: newsStore.length,
      items: newsStore,
    });
  } catch {
    return NextResponse.json(
      { error: "גוף הבקשה לא תקין" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/news?id=xxx
 * Delete a specific news item
 */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "חסר פרמטר id" }, { status: 400 });
  }
  newsStore = newsStore.filter((n) => n.id !== id);
  return NextResponse.json({ success: true, count: newsStore.length });
}
