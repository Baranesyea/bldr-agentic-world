import { NextResponse } from "next/server";

interface VideoItem {
  videoId: string;
  title: string;
  published: string;
}

let cache: { data: VideoItem[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getChannelId(): Promise<string> {
  // Try fetching the channel page to extract channel ID
  const res = await fetch("https://www.youtube.com/@eranbrownstain", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();

  // Look for channel ID in meta tags or page content
  const match =
    html.match(/\"channelId\":\"(UC[a-zA-Z0-9_-]+)\"/) ||
    html.match(/channel_id=(UC[a-zA-Z0-9_-]+)/) ||
    html.match(/\"externalId\":\"(UC[a-zA-Z0-9_-]+)\"/);

  if (match) return match[1];
  throw new Error("Could not extract channel ID");
}

async function fetchVideos(): Promise<VideoItem[]> {
  const channelId = await getChannelId();
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(feedUrl);
  const xml = await res.text();

  const videos: VideoItem[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let entryMatch;

  while ((entryMatch = entryRegex.exec(xml)) !== null && videos.length < 10) {
    const entry = entryMatch[1];
    const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);

    if (videoIdMatch && titleMatch) {
      const title = titleMatch[1];
      // Filter out shorts — they often have #shorts in title or very short titles
      if (title.toLowerCase().includes("#short")) continue;
      videos.push({
        videoId: videoIdMatch[1],
        title,
        published: publishedMatch ? publishedMatch[1] : "",
      });
    }
  }

  return videos;
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    const videos = await fetchVideos();
    cache = { data: videos, timestamp: Date.now() };
    return NextResponse.json(videos);
  } catch (error) {
    console.error("YouTube feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch YouTube feed" },
      { status: 500 }
    );
  }
}
