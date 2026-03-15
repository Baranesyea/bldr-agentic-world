import { NextResponse } from "next/server";

interface InstaPost {
  shortcode: string;
  caption: string;
}

let cache: { data: InstaPost[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchPosts(): Promise<InstaPost[]> {
  // Try to fetch Instagram profile page and extract post shortcodes
  try {
    const res = await fetch("https://www.instagram.com/eran_brownstain/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    const html = await res.text();

    // Extract shortcodes from the page
    const posts: InstaPost[] = [];
    const shortcodeRegex = /"shortcode":"([A-Za-z0-9_-]+)"/g;
    let match;
    const seen = new Set<string>();

    while ((match = shortcodeRegex.exec(html)) !== null && posts.length < 12) {
      const shortcode = match[1];
      if (seen.has(shortcode)) continue;
      seen.add(shortcode);
      posts.push({ shortcode, caption: "" });
    }

    if (posts.length > 0) return posts;

    // Fallback: try extracting from shared data
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});<\/script>/);
    if (sharedDataMatch) {
      const data = JSON.parse(sharedDataMatch[1]);
      const edges = data?.entry_data?.ProfilePage?.[0]?.graphql?.user?.edge_owner_to_timeline_media?.edges || [];
      for (const edge of edges.slice(0, 12)) {
        const node = edge.node;
        posts.push({
          shortcode: node.shortcode,
          caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || "",
        });
      }
    }

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
