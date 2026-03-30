import { NextResponse } from "next/server";

interface VideoItem {
  videoId: string;
  title: string;
  published: string;
}

const CHANNEL_ID = "UCIwzIk_Q3_axwgsbbW4FzSg";
const API_KEY = process.env.YOUTUBE_API_KEY;

let cache: { data: { videos: VideoItem[]; shorts: VideoItem[] }; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function isShort(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      method: "HEAD",
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    // 200 = it's a short, 302/303 = regular video
    return res.status === 200;
  } catch {
    return false;
  }
}

async function fetchAllUploads(): Promise<{ videos: VideoItem[]; shorts: VideoItem[] }> {
  if (!API_KEY) throw new Error("YOUTUBE_API_KEY not set");

  const uploadsPlaylistId = CHANNEL_ID.replace("UC", "UU");
  const allItems: VideoItem[] = [];
  let pageToken = "";

  // Fetch up to 100 uploads to have enough after filtering
  while (allItems.length < 100) {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items) break;

    for (const item of data.items) {
      allItems.push({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        published: item.snippet.publishedAt,
      });
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  // Check each video against YouTube's /shorts/ endpoint
  const videos: VideoItem[] = [];
  const shorts: VideoItem[] = [];

  // Process in parallel batches of 10 for speed
  for (let i = 0; i < allItems.length; i += 10) {
    if (videos.length >= 20 && shorts.length >= 20) break;
    const batch = allItems.slice(i, i + 10);
    const results = await Promise.all(
      batch.map(async (item) => ({
        item,
        isShortVideo: await isShort(item.videoId),
      }))
    );
    for (const { item, isShortVideo } of results) {
      if (isShortVideo) {
        if (shorts.length < 20) shorts.push(item);
      } else {
        if (videos.length < 20) videos.push(item);
      }
    }
  }

  return { videos, shorts };
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    const result = await fetchAllUploads();
    cache = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error) {
    console.error("YouTube feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch YouTube feed" },
      { status: 500 }
    );
  }
}
