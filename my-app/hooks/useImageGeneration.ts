import { useState, useCallback } from "react";
import { Platform, GeneratedImage, PLATFORM_IMAGE_SIZES } from "@/types/news";

type ImageStyle = "modern" | "minimal" | "tech" | "gradient";

interface ImageGenerationOptions {
  headline: string;
  summary?: string;
  platform: Platform;
  aspectRatio?: string;
  style?: ImageStyle;
}

interface ImageGenerationResult {
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  aspectRatio: string;
  headline: string;
  platform: string;
  style: string;
  createdAt: string;
}

interface UseImageGenerationReturn {
  isGenerating: boolean;
  error: string | null;
  generateImage: (options: ImageGenerationOptions) => Promise<GeneratedImage | null>;
  getSizes: (platform: Platform) => typeof PLATFORM_IMAGE_SIZES[Platform];
}

export function useImageGeneration(): UseImageGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(
    async (options: ImageGenerationOptions): Promise<GeneratedImage | null> => {
      const {
        headline,
        summary,
        platform,
        aspectRatio = "16:9",
        style = "modern",
      } = options;

      setIsGenerating(true);
      setError(null);

      try {
        const response = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "generate",
            headline,
            summary: summary || headline,
            platform,
            aspectRatio,
            style,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "이미지 생성에 실패했습니다");
        }

        const result: ImageGenerationResult = await response.json();

        const generatedImage: GeneratedImage = {
          base64: result.base64,
          mimeType: result.mimeType,
          width: result.width,
          height: result.height,
          aspectRatio: result.aspectRatio,
          headline: result.headline,
          createdAt: result.createdAt,
        };

        return generatedImage;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다";
        setError(errorMessage);
        console.error("Image generation error:", err);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const getSizes = useCallback((platform: Platform) => {
    return PLATFORM_IMAGE_SIZES[platform] || PLATFORM_IMAGE_SIZES.twitter;
  }, []);

  return {
    isGenerating,
    error,
    generateImage,
    getSizes,
  };
}

// 이미지 스타일 옵션
export const IMAGE_STYLES: { value: ImageStyle; label: string; description: string }[] = [
  {
    value: "modern",
    label: "모던",
    description: "깔끔하고 전문적인 디자인",
  },
  {
    value: "tech",
    label: "테크",
    description: "미래지향적인 기술 느낌",
  },
  {
    value: "gradient",
    label: "그라데이션",
    description: "화려한 색상 그라데이션",
  },
  {
    value: "minimal",
    label: "미니멀",
    description: "심플하고 깔끔한 스타일",
  },
];
