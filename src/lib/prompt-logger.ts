export interface PromptLogEntry {
  id: string;
  timestamp: string;
  type: "avatar" | "thumbnail" | "other";
  userName: string;
  userEmail: string;
  prompt: string;
  response: string;
  status: "success" | "error" | "fallback";
  duration: number;
  apiProvider: string;
}

const STORAGE_KEY = "bldr_prompt_logs";

export function logPrompt(
  entry: Omit<PromptLogEntry, "id" | "timestamp">
): void {
  const full: PromptLogEntry = {
    ...entry,
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
  };
  const existing = getPromptLogs();
  existing.unshift(full);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }
}

export function getPromptLogs(): PromptLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function seedSampleLogs(): void {
  if (typeof window === "undefined") return;
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return;

  const samples: PromptLogEntry[] = [
    {
      id: "log-001",
      timestamp: "2026-03-15T10:23:41.000Z",
      type: "avatar",
      userName: "ערן בראון",
      userEmail: "eran@bldr.co.il",
      prompt: "Create a professional avatar for a male business coach, age 35, wearing a dark suit, confident expression, studio lighting, white background, photorealistic style",
      response: "https://images.example.com/avatars/eran-v1.png",
      status: "success",
      duration: 4230,
      apiProvider: "Nano Banana 2",
    },
    {
      id: "log-002",
      timestamp: "2026-03-15T09:15:12.000Z",
      type: "thumbnail",
      userName: "שירה כהן",
      userEmail: "shira@bldr.co.il",
      prompt: "Generate a YouTube thumbnail: bold Hebrew text 'איך למכור בלייב', person speaking into camera, bright orange and blue gradient background, energetic feel",
      response: "https://images.example.com/thumbnails/live-selling-001.png",
      status: "success",
      duration: 3850,
      apiProvider: "Nano Banana 2",
    },
    {
      id: "log-003",
      timestamp: "2026-03-14T16:42:08.000Z",
      type: "avatar",
      userName: "ערן בראון",
      userEmail: "eran@bldr.co.il",
      prompt: "Create a cartoon-style avatar for a tech educator, casual hoodie, glasses, friendly smile, gradient purple background",
      response: "API rate limit exceeded. Retry after 60 seconds.",
      status: "error",
      duration: 1200,
      apiProvider: "Nano Banana 2",
    },
    {
      id: "log-004",
      timestamp: "2026-03-14T16:43:15.000Z",
      type: "avatar",
      userName: "ערן בראון",
      userEmail: "eran@bldr.co.il",
      prompt: "Create a cartoon-style avatar for a tech educator, casual hoodie, glasses, friendly smile, gradient purple background",
      response: "https://images.example.com/avatars/eran-cartoon-fallback.png",
      status: "fallback",
      duration: 6100,
      apiProvider: "DALL-E 3 (fallback)",
    },
    {
      id: "log-005",
      timestamp: "2026-03-13T11:30:00.000Z",
      type: "thumbnail",
      userName: "דני לוי",
      userEmail: "dani@bldr.co.il",
      prompt: "YouTube thumbnail: '5 טעויות באוטומציה' text, split screen showing wrong vs right, red X and green checkmark, dark theme",
      response: "https://images.example.com/thumbnails/automation-mistakes.png",
      status: "success",
      duration: 4100,
      apiProvider: "Nano Banana 2",
    },
    {
      id: "log-006",
      timestamp: "2026-03-12T08:20:33.000Z",
      type: "other",
      userName: "שירה כהן",
      userEmail: "shira@bldr.co.il",
      prompt: "Generate a course cover image: modern flat design, AI and automation theme, circuit patterns, blue and purple palette, 1920x1080",
      response: "https://images.example.com/covers/ai-course-cover.png",
      status: "success",
      duration: 5200,
      apiProvider: "Nano Banana 2",
    },
    {
      id: "log-007",
      timestamp: "2026-03-11T14:55:20.000Z",
      type: "avatar",
      userName: "דני לוי",
      userEmail: "dani@bldr.co.il",
      prompt: "Professional headshot avatar, male, age 28, dark hair, blue shirt, neutral background, corporate style",
      response: "Connection timeout after 30000ms",
      status: "error",
      duration: 30000,
      apiProvider: "Nano Banana 2",
    },
    {
      id: "log-008",
      timestamp: "2026-03-10T19:10:45.000Z",
      type: "thumbnail",
      userName: "ערן בראון",
      userEmail: "eran@bldr.co.il",
      prompt: "Instagram story thumbnail: 'טיפ יומי' floating text, minimalist design, soft gradient, 1080x1920 vertical format",
      response: "https://images.example.com/thumbnails/daily-tip-story.png",
      status: "success",
      duration: 3400,
      apiProvider: "Nano Banana 2",
    },
    {
      id: "log-009",
      timestamp: "2026-03-09T07:05:11.000Z",
      type: "avatar",
      userName: "שירה כהן",
      userEmail: "shira@bldr.co.il",
      prompt: "Female presenter avatar, professional look, blazer, warm smile, studio background, high quality portrait",
      response: "https://images.example.com/avatars/shira-fallback.png",
      status: "fallback",
      duration: 7800,
      apiProvider: "Stable Diffusion (fallback)",
    },
    {
      id: "log-010",
      timestamp: "2026-03-08T22:33:00.000Z",
      type: "other",
      userName: "דני לוי",
      userEmail: "dani@bldr.co.il",
      prompt: "Generate social media banner: 'BLDR Academy' branding, modern tech aesthetic, 1500x500, dark mode compatible",
      response: "https://images.example.com/banners/bldr-academy-banner.png",
      status: "success",
      duration: 4600,
      apiProvider: "Nano Banana 2",
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
}
