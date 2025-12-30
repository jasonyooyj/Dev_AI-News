import { NextRequest, NextResponse } from "next/server";
import {
  summarizeNews,
  generatePlatformContent,
  analyzeStyle,
  regenerateContent,
  translateContent,
} from "@/lib/gemini";

type Mode =
  | "summarize"
  | "generate"
  | "analyze-style"
  | "regenerate"
  | "translate";

interface RequestBody {
  mode: Mode;
  // summarize
  title?: string;
  content?: string;
  // generate
  platform?: string;
  styleTemplate?: {
    tone?: string;
    characteristics?: string[];
    examples?: string[];
  };
  url?: string;
  // analyze-style
  examples?: string[];
  // regenerate
  previousContent?: string;
  feedback?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { mode } = body;

    // === MODE: summarize ===
    // 뉴스 수집 시 핵심 요약 생성 (headline, bullets, insight, wowFactor)
    if (mode === "summarize") {
      const { title, content } = body;

      // 빈 content나 너무 짧은 content 처리
      if (!title) {
        return NextResponse.json(
          { error: "Title is required for summarize mode" },
          { status: 400 }
        );
      }

      // content가 없거나 너무 짧으면 기본 요약 반환
      const trimmedContent = (content || "").trim();
      if (trimmedContent.length < 50) {
        return NextResponse.json({
          headline: title,
          bullets: [
            `${title} - 자세한 내용은 원문을 확인하세요.`,
            "추가 정보가 필요합니다.",
            "원문 링크에서 전체 내용을 확인할 수 있습니다.",
          ],
          insight: "자세한 내용은 원문을 확인해주세요.",
          category: "other",
        });
      }

      const result = await summarizeNews(title, trimmedContent);
      return NextResponse.json(result);
    }

    // === MODE: generate ===
    // 특정 플랫폼용 콘텐츠 생성 (문체 템플릿 적용)
    if (mode === "generate") {
      const { title, content, platform, styleTemplate, url } = body;

      if (!title || !content || !platform) {
        return NextResponse.json(
          { error: "Title, content, and platform are required for generate mode" },
          { status: 400 }
        );
      }

      const validPlatforms = ["twitter", "threads", "instagram", "linkedin"];
      if (!validPlatforms.includes(platform)) {
        return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
      }

      const result = await generatePlatformContent(
        title,
        content,
        platform,
        styleTemplate,
        url
      );
      return NextResponse.json(result);
    }

    // === MODE: analyze-style ===
    // 예시 텍스트에서 문체 분석
    if (mode === "analyze-style") {
      const { examples } = body;

      if (!examples || examples.length === 0) {
        return NextResponse.json(
          { error: "Examples are required for analyze-style mode" },
          { status: 400 }
        );
      }

      const result = await analyzeStyle(examples);
      return NextResponse.json(result);
    }

    // === MODE: regenerate ===
    // 피드백을 반영하여 콘텐츠 재생성
    if (mode === "regenerate") {
      const { previousContent, feedback, platform } = body;

      if (!previousContent || !feedback || !platform) {
        return NextResponse.json(
          {
            error:
              "previousContent, feedback, and platform are required for regenerate mode",
          },
          { status: 400 }
        );
      }

      const result = await regenerateContent(previousContent, feedback, platform);
      return NextResponse.json(result);
    }

    // === MODE: translate ===
    // 기사 원문 번역 (요약 금지, 원문 충실 번역)
    if (mode === "translate") {
      const { title, content } = body;

      if (!content) {
        return NextResponse.json(
          { error: "Content is required for translate mode" },
          { status: 400 }
        );
      }

      const result = await translateContent(title || "", content);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error) {
    console.error("AI API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to process with AI: ${errorMessage}` },
      { status: 500 }
    );
  }
}
