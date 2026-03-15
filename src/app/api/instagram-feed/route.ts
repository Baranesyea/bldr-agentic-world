import { NextResponse } from "next/server";

interface InstaPost {
  shortcode: string;
}

let cache: { data: InstaPost[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchPosts(): Promise<InstaPost[]> {
  try {
    // Fetch the Instagram profile page
    const res = await fetch("https://www.instagram.com/eran_brownstain/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const html = await res.text();

    const posts: InstaPost[] = [];
    const seen = new Set<string>();

    // Method 1: Extract shortcodes from JSON in the page
    const shortcodeRegex = /"shortcode"\s*:\s*"([A-Za-z0-9_-]{8,})"/g;
    let match;
    while ((match = shortcodeRegex.exec(html)) !== null && posts.length < 12) {
      const shortcode = match[1];
      if (seen.has(shortcode)) continue;
      seen.add(shortcode);
      posts.push({ shortcode });
    }

    if (posts.length > 0) return posts;

    // Method 2: Try the __a=1 endpoint (may be blocked)
    try {
      const apiRes = await fetch("https://www.instagram.com/eran_brownstain/?__a=1&__d=dis", {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
          "Accept": "application/json",
        },
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        const edges = data?.graphql?.user?.edge_owner_to_timeline_media?.edges || [];
        for (const edge of edges.slice(0, 12)) {
          if (!seen.has(edge.node.shortcode)) {
            posts.push({ shortcode: edge.node.shortcode });
          }
        }
      }
    } catch {}

    return posts;
  } catch (error) {
    console.error("Instagram fetch error:", error);
    return [];
  }
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    const posts = await fetchPosts();
    if (posts.length > 0) {
      cache = { data: posts, timestamp: Date.now() };
    }
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Instagram feed error:", error);
    return NextResponse.json([]);
  }
}
