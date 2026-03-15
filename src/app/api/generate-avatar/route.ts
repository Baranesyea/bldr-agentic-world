import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { gender, apiKey, referenceImageUrl, userName } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "missing_api_key", message: "מפתח API של Nano Banana 2 לא הוגדר. הגדר אותו בהגדרות." },
        { status: 400 }
      );
    }

    // Build the prompt based on gender and reference
    const genderText = gender === "female" ? "woman" : "man";
    const prompt = `Professional avatar portrait of a ${genderText}, modern digital art style, clean background with subtle gradient, friendly expression, high quality, centered face composition, suitable for a learning platform profile picture. Name: ${userName || "User"}.`;

    // Call Nano Banana 2 API (fal.ai compatible endpoint)
    // The API key format and endpoint may vary - this supports common image gen APIs
    const response = await fetch("https://api.nano-banana.com/v2/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: "ugly, deformed, blurry, low quality, text, watermark",
        width: 512,
        height: 512,
        num_inference_steps: 30,
        ...(referenceImageUrl ? { image_url: referenceImageUrl } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("Nano Banana API error:", response.status, errorText);
      return NextResponse.json(
        { error: "api_error", message: `שגיאה מ-API: ${response.status}` },
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
      console.error("Unexpected API response format:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json(
        { error: "no_image", message: "ה-API לא החזיר תמונה. בדוק את ההגדרות." },
        { status: 502 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Avatar generation error:", error);
    return NextResponse.json(
      { error: "server_error", message: "שגיאה בלתי צפויה ביצירת האווטאר." },
      { status: 500 }
    );
  }
}
