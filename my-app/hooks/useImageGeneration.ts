import { useState, useCallback } from "react";
import { Platform, GeneratedImage, PLATFORM_IMAGE_SIZES } from "@/types/news";

interface ImageGenerationOptions {
  headline: string;
  summary?: string;
  platform: Platform;
  aspectRatio?: string;
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
        aspectRatio = "9:16",
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

