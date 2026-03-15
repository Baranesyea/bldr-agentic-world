import { NextResponse } from "next/server";

interface VideoItem {
  videoId: string;
  title: string;
  published: string;
}

let cache: { data: VideoItem[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getChannelId(): Promise<string> {
  const res = await fetch("https://www.youtube.com/@eranbrownstain", {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
  });
  const html = await res.text();

  const match =
    html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/) ||
    html.match(/channel_id=(UC[a-zA-Z0-9_-]+)/) ||
    html.match(/"externalId":"(UC[a-zA-Z0-9_-]+)"/);

  if (match) return match[1];
  throw new Error("Could not extract channel ID");
}

async function isShort(videoId: string): Promise<boolean> {
  // Check if the /shorts/ URL redirects (meaning it IS a short)
  // YouTube returns 200 for shorts at /shorts/ID and redirects for non-shorts
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      method: "HEAD",
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    // If 200 = it's a short, if 303/302 = it's a regular video
    return res.status === 200;
  } catch {
    return false;
  }
}

async function fetchVideos(): Promise<VideoItem[]> {
  const channelId = await getChannelId();
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(feedUrl);
  const xml = await res.text();

  // Parse all entries from RSS
  const allCandidates: VideoItem[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let entryMatch;

  while ((entryMatch = entryRegex.exec(xml)) !== null && allCandidates.length < 25) {
    const entry = entryMatch[1];
    const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);

    if (videoIdMatch && titleMatch) {
      const title = titleMatch[1];
      // Quick filter: skip obvious shorts by title
      if (title.toLowerCase().includes("#short")) continue;
      allCandidates.push({
        videoId: videoIdMatch[1],
        title,
        published: publishedMatch ? publishedMatch[1] : "",
      });
    }
  }

  // Check each candidate against YouTube's /shorts/ endpoint
  const results: VideoItem[] = [];
  for (const video of allCandidates) {
    if (results.length >= 10) break;
    const short = await isShort(video.videoId);
    if (!short) {
      results.push(video);
    }
  }

  return results;
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
