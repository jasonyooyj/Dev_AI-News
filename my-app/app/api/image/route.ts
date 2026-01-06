import { NextRequest, NextResponse } from "next/server";
import { generateNewsImage } from "@/lib/gemini";
import { getPlatformImageSize } from "@/lib/image-overlay";

interface RequestBody {
  mode: "generate" | "sizes";
  // generate mode
  headline?: string;
  summary?: string;
  platform?: string;
  aspectRatio?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { mode } = body;

    // === MODE: sizes ===
    // 플랫폼별 사용 가능한 이미지 사이즈 반환
    if (mode === "sizes") {
      const { platform } = body;

      if (!platform) {
        return NextResponse.json(
          { error: "Platform is required for sizes mode" },
          { status: 400 }
        );
      }

      const sizes: Record<string, Array<{ aspectRatio: string; label: string; width: number; height: number }>> = {
        twitter: [
          { aspectRatio: "16:9", label: "가로 (16:9)", ...getPlatformImageSize("twitter", "16:9") },
          { aspectRatio: "1:1", label: "정사각형 (1:1)", ...getPlatformImageSize("twitter", "1:1") },
          { aspectRatio: "4:5", label: "세로 (4:5)", ...getPlatformImageSize("twitter", "4:5") },
        ],
        threads: [
          { aspectRatio: "4:5", label: "세로 (4:5)", ...getPlatformImageSize("threads", "4:5") },
          { aspectRatio: "1:1", label: "정사각형 (1:1)", ...getPlatformImageSize("threads", "1:1") },
          { aspectRatio: "9:16", label: "스토리 (9:16)", ...getPlatformImageSize("threads", "9:16") },
        ],
        instagram: [
          { aspectRatio: "4:5", label: "피드 세로 (4:5)", ...getPlatformImageSize("instagram", "4:5") },
          { aspectRatio: "1:1", label: "피드 정사각형 (1:1)", ...getPlatformImageSize("instagram", "1:1") },
          { aspectRatio: "9:16", label: "스토리/릴스 (9:16)", ...getPlatformImageSize("instagram", "9:16") },
        ],
        linkedin: [
          { aspectRatio: "1.91:1", label: "피드 가로 (1.91:1)", ...getPlatformImageSize("linkedin", "1.91:1") },
          { aspectRatio: "1:1", label: "피드 정사각형 (1:1)", ...getPlatformImageSize("linkedin", "1:1") },
          { aspectRatio: "16:9", label: "아티클 커버 (16:9)", ...getPlatformImageSize("linkedin", "16:9") },
        ],
        bluesky: [
          { aspectRatio: "16:9", label: "가로 (16:9)", ...getPlatformImageSize("bluesky", "16:9") },
          { aspectRatio: "1:1", label: "정사각형 (1:1)", ...getPlatformImageSize("bluesky", "1:1") },
        ],
      };

      return NextResponse.json({ sizes: sizes[platform] || [] });
    }

    // === MODE: generate ===
    // AI 배경 이미지 생성 + 헤드라인 텍스트 오버레이
    if (mode === "generate") {
      const { headline, summary, platform, aspectRatio } = body;

      if (!headline || !platform) {
        return NextResponse.json(
          { error: "Headline and platform are required for generate mode" },
          { status: 400 }
        );
      }

      const validPlatforms = ["twitter", "threads", "instagram", "linkedin", "bluesky"];
      if (!validPlatforms.includes(platform)) {
        return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
      }

      const targetAspectRatio = aspectRatio || "9:16";
      const summaryText = summary || headline;

      // Gemini로 헤드라인 텍스트가 포함된 이미지 생성
      const aiImage = await generateNewsImage(
        headline,
        summaryText,
        platform,
        targetAspectRatio
      );

      const size = getPlatformImageSize(platform, targetAspectRatio);

      return NextResponse.json({
        base64: aiImage.base64,
        mimeType: aiImage.mimeType,
        width: size.width,
        height: size.height,
        aspectRatio: targetAspectRatio,
        headline,
        platform,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error) {
    console.error("Image API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to process image: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// GET: 이미지 직접 렌더링 (URL 파라미터로 이미지 생성)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const headline = searchParams.get("headline") || "AI 뉴스";
    const platform = searchParams.get("platform") || "twitter";
    const aspectRatio = searchParams.get("aspect") || "9:16";

    // Gemini로 헤드라인 텍스트가 포함된 이미지 생성
    const aiImage = await generateNewsImage(
      headline,
      headline,
      platform,
      aspectRatio
    );

    const imageBuffer = Buffer.from(aiImage.base64, "base64");

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": aiImage.mimeType || "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Image GET error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
