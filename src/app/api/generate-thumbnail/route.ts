import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { title, subtitle, style, apiKey, brand, thumbDefaults } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "missing_api_key", message: "מפתח API של Nano Banana 2 לא הוגדר. הגדר אותו בהגדרות → מפתחות API." },
        { status: 400 }
      );
    }

    // Build prompt from brand settings, thumbnail defaults, and course info
    const brandContext = brand
      ? `Brand colors: primary ${brand.primaryColor}, secondary ${brand.secondaryColor}, accent ${brand.accentColor}. Gradient from ${brand.gradientStartColor} to ${brand.gradientEndColor} direction ${brand.gradientDirection}.`
      : "";

    const styleMap: Record<string, string> = {
      Minimal: "clean, minimal, lots of negative space, subtle typography",
      Bold: "bold, high contrast, large impactful text, dramatic lighting",
      Cinematic: "cinematic, movie poster style, dramatic depth, atmospheric lighting, lens flare",
      Gradient: "smooth gradient background, modern, sleek, tech-forward aesthetic",
    };

    const styleDesc = styleMap[style] || styleMap.Gradient;
    const notesContext = thumbDefaults?.promptNotes ? `Additional style notes: ${thumbDefaults.promptNotes}` : "";

    const prompt = `Create a professional course thumbnail for a Netflix-style learning platform.
Title: "${title}"${subtitle ? `\nSubtitle: "${subtitle}"` : ""}
Style: ${styleDesc}
${brandContext}
${notesContext}
The thumbnail should be dark-themed, premium looking, suitable for a modern online course platform. Text should be clearly readable. 16:9 aspect ratio. High quality, professional design.`;

    // Prepare reference images if available
    const referenceUrls = thumbDefaults?.referenceUrls?.filter((u: string) => u.trim()) || [];

    // Call Nano Banana 2 API
    const response = await fetch("https://api.nano-banana.com/v2/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: "ugly, blurry, low quality, distorted text, watermark, amateur, bright background, white background",
        width: 1280,
        height: 720,
        num_inference_steps: 30,
        ...(referenceUrls.length > 0 ? { reference_images: referenceUrls } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("Nano Banana API error:", response.status, errorText);
      return NextResponse.json(
        { error: "api_error", message: `שגיאה מ-API (${response.status}). בדוק שהמפתח תקין.` },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Try common response formats
    const imageUrl =
      data.image_url ||
      data.images?.[0]?.url ||
      data.output?.image_url ||
      data.data?.image_url ||
      data.url ||
      null;

    if (!imageUrl) {
      console.error("Unexpected response format:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json(
        { error: "no_image", message: "ה-API לא החזיר תמונה. נסה שוב או בדוק את ההגדרות." },
        { status: 502 }
      );
    }

    return NextResponse.json({ imageUrl, prompt });
  } catch (error) {
    console.error("Thumbnail generation error:", error);
    return NextResponse.json(
      { error: "server_error", message: "שגיאה בלתי צפויה ביצירת התמונה." },
      { status: 500 }
    );
  }
}
