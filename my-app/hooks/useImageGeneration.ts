import { useCallback, useEffect, useRef } from "react";
import { Platform, GeneratedImage, PLATFORM_IMAGE_SIZES } from "@/types/news";
import { useImageGenerationStore } from "@/store";
import { useImageGallery } from "@/hooks/useImageGallery";

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

interface HeadlineSuggestion {
  main: string;
  alternatives: string[];
}

interface UseImageGenerationWithStoreReturn {
  // State from store
  isGenerating: boolean;
  error: string | null;
  selectedPlatform: Platform;
  selectedAspectRatio: string;
  generatedImage: GeneratedImage | null;
  editableHeadline: string;
  suggestions: HeadlineSuggestion | null;
  isLoadingSuggestions: boolean;
  hasUserEdited: boolean;

  // Actions
  generateImage: () => Promise<GeneratedImage | null>;
  handlePlatformChange: (platform: Platform) => void;
  handleAspectRatioChange: (aspectRatio: string) => void;
  handleHeadlineChange: (headline: string) => void;
  handleSelectSuggestion: (suggestion: string) => void;
  generateSuggestions: (title: string, content?: string) => Promise<void>;
  getSizes: (platform: Platform) => typeof PLATFORM_IMAGE_SIZES[Platform];
}

// Store-based hook for persistent state across tab switches
export function useImageGenerationWithStore(
  newsId: string,
  initialHeadline: string,
  summary?: string
): UseImageGenerationWithStoreReturn {
  const store = useImageGenerationStore();
  const { addImage } = useImageGallery();
  const hasFetchedSuggestions = useRef(false);

  // Initialize state on mount
  useEffect(() => {
    store.initState(newsId, initialHeadline);
  }, [newsId, initialHeadline]);

  // Get current state
  const state = store.getState(newsId);

  const isGenerating = state?.isGenerating ?? false;
  const error = state?.error ?? null;
  const selectedPlatform = state?.selectedPlatform ?? "twitter";
  const selectedAspectRatio = state?.selectedAspectRatio ?? "9:16";
  const generatedImage = state?.generatedImage ?? null;
  const editableHeadline = state?.editableHeadline ?? initialHeadline;
  const suggestions = state?.suggestions ?? null;
  const isLoadingSuggestions = state?.isLoadingSuggestions ?? false;
  const hasUserEdited = state?.hasUserEdited ?? false;

  const generateImage = useCallback(async (): Promise<GeneratedImage | null> => {
    if (!state) return null;

    store.setGenerating(newsId, true);
    store.setError(newsId, null);

    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          headline: editableHeadline,
          summary: summary || editableHeadline,
          platform: selectedPlatform,
          aspectRatio: selectedAspectRatio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "이미지 생성에 실패했습니다");
      }

      const result: ImageGenerationResult = await response.json();

      const generatedImageResult: GeneratedImage = {
        base64: result.base64,
        mimeType: result.mimeType,
        width: result.width,
        height: result.height,
        aspectRatio: result.aspectRatio,
        headline: result.headline,
        createdAt: result.createdAt,
      };

      store.setGeneratedImage(newsId, generatedImageResult);

      // 갤러리에 저장
      addImage({
        base64: generatedImageResult.base64,
        mimeType: generatedImageResult.mimeType,
        headline: editableHeadline,
        platform: selectedPlatform,
        aspectRatio: selectedAspectRatio,
        width: generatedImageResult.width,
        height: generatedImageResult.height,
      });

      return generatedImageResult;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다";
      store.setError(newsId, errorMessage);
      console.error("Image generation error:", err);
      return null;
    } finally {
      store.setGenerating(newsId, false);
    }
  }, [newsId, editableHeadline, summary, selectedPlatform, selectedAspectRatio, state, addImage]);

  const handlePlatformChange = useCallback((platform: Platform) => {
    store.setSelectedPlatform(newsId, platform);
    const sizes = PLATFORM_IMAGE_SIZES[platform];
    if (sizes && sizes.length > 0) {
      store.setSelectedAspectRatio(newsId, sizes[0].aspectRatio);
    }
  }, [newsId]);

  const handleAspectRatioChange = useCallback((aspectRatio: string) => {
    store.setSelectedAspectRatio(newsId, aspectRatio);
  }, [newsId]);

  const handleHeadlineChange = useCallback((headline: string) => {
    store.setEditableHeadline(newsId, headline, true);
  }, [newsId]);

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    store.setEditableHeadline(newsId, suggestion.replace(/\\n/g, "\n"), true);
  }, [newsId]);

  const generateSuggestions = useCallback(async (title: string, content?: string) => {
    if (hasFetchedSuggestions.current) return;
    hasFetchedSuggestions.current = true;

    store.setLoadingSuggestions(newsId, true);
    try {
      const response = await fetch("/api/headline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate suggestions");
      }

      const data: HeadlineSuggestion = await response.json();
      store.setSuggestions(newsId, data);

      // Auto-select the main suggestion if user hasn't edited
      if (data.main && !hasUserEdited) {
        store.setEditableHeadline(newsId, data.main.replace(/\\n/g, "\n"), false);
      }
    } catch (err) {
      console.error("Failed to generate headline suggestions:", err);
    } finally {
      store.setLoadingSuggestions(newsId, false);
    }
  }, [newsId, hasUserEdited]);

  // Reset hasFetchedSuggestions when newsId changes
  useEffect(() => {
    hasFetchedSuggestions.current = !!suggestions;
  }, [newsId, suggestions]);

  const getSizes = useCallback((platform: Platform) => {
    return PLATFORM_IMAGE_SIZES[platform] || PLATFORM_IMAGE_SIZES.twitter;
  }, []);

  return {
    isGenerating,
    error,
    selectedPlatform,
    selectedAspectRatio,
    generatedImage,
    editableHeadline,
    suggestions,
    isLoadingSuggestions,
    hasUserEdited,
    generateImage,
    handlePlatformChange,
    handleAspectRatioChange,
    handleHeadlineChange,
    handleSelectSuggestion,
    generateSuggestions,
    getSizes,
  };
}

// Legacy hook for backward compatibility (used by QuickImageButton)
interface UseImageGenerationReturn {
  isGenerating: boolean;
  error: string | null;
  generateImage: (options: ImageGenerationOptions) => Promise<GeneratedImage | null>;
  getSizes: (platform: Platform) => typeof PLATFORM_IMAGE_SIZES[Platform];
}

export function useImageGeneration(): UseImageGenerationReturn {
  const store = useImageGenerationStore();

  // Use a special key for legacy usage
  const legacyKey = "__legacy__";

  // Initialize if not exists
  useEffect(() => {
    if (!store.getState(legacyKey)) {
      store.initState(legacyKey, "");
    }
  }, []);

  const state = store.getState(legacyKey);
  const isGenerating = state?.isGenerating ?? false;
  const error = state?.error ?? null;

  const generateImage = useCallback(
    async (options: ImageGenerationOptions): Promise<GeneratedImage | null> => {
      const {
        headline,
        summary,
        platform,
        aspectRatio = "9:16",
      } = options;

      store.setGenerating(legacyKey, true);
      store.setError(legacyKey, null);

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

        const generatedImageResult: GeneratedImage = {
          base64: result.base64,
          mimeType: result.mimeType,
          width: result.width,
          height: result.height,
          aspectRatio: result.aspectRatio,
          headline: result.headline,
          createdAt: result.createdAt,
        };

        return generatedImageResult;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다";
        store.setError(legacyKey, errorMessage);
        console.error("Image generation error:", err);
        return null;
      } finally {
        store.setGenerating(legacyKey, false);
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
