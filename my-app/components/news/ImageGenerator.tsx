"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Platform,
  GeneratedImage,
  PLATFORM_IMAGE_SIZES,
  PLATFORM_CONFIGS,
} from "@/types/news";
import { useImageGeneration, IMAGE_STYLES } from "@/hooks/useImageGeneration";

interface ImageGeneratorProps {
  headline: string;
  summary?: string;
  platforms?: Platform[];
  onImageGenerated?: (platform: Platform, image: GeneratedImage) => void;
}

type ImageStyle = "modern" | "minimal" | "tech" | "gradient";

export function ImageGenerator({
  headline,
  summary,
  platforms = ["twitter", "threads", "instagram", "linkedin", "bluesky"],
  onImageGenerated,
}: ImageGeneratorProps) {
  const { isGenerating, error, generateImage, getSizes } = useImageGeneration();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(platforms[0]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("16:9");
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>("modern");
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);

  const platformSizes = getSizes(selectedPlatform);

  const handlePlatformChange = useCallback((platform: Platform) => {
    setSelectedPlatform(platform);
    // 플랫폼 변경 시 첫 번째 사이즈로 초기화
    const sizes = PLATFORM_IMAGE_SIZES[platform];
    if (sizes && sizes.length > 0) {
      setSelectedAspectRatio(sizes[0].aspectRatio);
    }
    setGeneratedImage(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    const result = await generateImage({
      headline,
      summary,
      platform: selectedPlatform,
      aspectRatio: selectedAspectRatio,
      style: selectedStyle,
    });

    if (result) {
      setGeneratedImage(result);
      onImageGenerated?.(selectedPlatform, result);
    }
  }, [
    generateImage,
    headline,
    summary,
    selectedPlatform,
    selectedAspectRatio,
    selectedStyle,
    onImageGenerated,
  ]);

  const handleDownload = useCallback(() => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = `data:${generatedImage.mimeType};base64,${generatedImage.base64}`;
    link.download = `${selectedPlatform}-${selectedAspectRatio.replace(":", "x")}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generatedImage, selectedPlatform, selectedAspectRatio]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(
        `data:${generatedImage.mimeType};base64,${generatedImage.base64}`
      );
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [generatedImage.mimeType]: blob }),
      ]);
      alert("이미지가 클립보드에 복사되었습니다!");
    } catch (err) {
      console.error("Failed to copy image:", err);
      alert("이미지 복사에 실패했습니다.");
    }
  }, [generatedImage]);

  return (
    <div className="space-y-4">
      {/* 플랫폼 선택 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          플랫폼 선택
        </label>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <Button
              key={platform}
              variant={selectedPlatform === platform ? "primary" : "secondary"}
              size="sm"
              onClick={() => handlePlatformChange(platform)}
            >
              {PLATFORM_CONFIGS[platform].name}
            </Button>
          ))}
        </div>
      </div>

      {/* 사이즈 선택 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          이미지 사이즈
        </label>
        <div className="flex flex-wrap gap-2">
          {platformSizes.map((size) => (
            <Button
              key={size.aspectRatio}
              variant={selectedAspectRatio === size.aspectRatio ? "primary" : "secondary"}
              size="sm"
              onClick={() => setSelectedAspectRatio(size.aspectRatio)}
            >
              {size.label}
              <span className="ml-1 text-xs opacity-70">
                ({size.width}×{size.height})
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* 스타일 선택 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          이미지 스타일
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {IMAGE_STYLES.map((style) => (
            <button
              key={style.value}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedStyle === style.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedStyle(style.value)}
            >
              <div className="font-medium text-sm">{style.label}</div>
              <div className="text-xs text-muted-foreground">{style.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 헤드라인 미리보기 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          헤드라인 (이미지에 표시됨)
        </label>
        <div className="p-3 bg-muted rounded-lg text-sm">
          {headline}
        </div>
      </div>

      {/* 생성 버튼 */}
      <Button
        variant="primary"
        className="w-full"
        onClick={handleGenerate}
        disabled={isGenerating || !headline}
      >
        {isGenerating ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            이미지 생성 중...
          </>
        ) : (
          <>
            🎨 이미지 생성하기
          </>
        )}
      </Button>

      {/* 에러 표시 */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 생성된 이미지 미리보기 */}
      {generatedImage && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
              <img
                src={`data:${generatedImage.mimeType};base64,${generatedImage.base64}`}
                alt="Generated image"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-xs text-muted-foreground">
              {generatedImage.width} × {generatedImage.height} • {selectedPlatform} • {selectedAspectRatio}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={handleDownload}
              >
                📥 다운로드
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={handleCopyToClipboard}
              >
                📋 복사
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 간단한 이미지 생성 버튼 컴포넌트 (뉴스 카드에 사용)
interface QuickImageButtonProps {
  headline: string;
  summary?: string;
  platform: Platform;
  onGenerated?: (image: GeneratedImage) => void;
}

export function QuickImageButton({
  headline,
  summary,
  platform,
  onGenerated,
}: QuickImageButtonProps) {
  const { isGenerating, generateImage } = useImageGeneration();
  const sizes = PLATFORM_IMAGE_SIZES[platform];
  const defaultAspectRatio = sizes?.[0]?.aspectRatio || "16:9";

  const handleClick = async () => {
    const result = await generateImage({
      headline,
      summary,
      platform,
      aspectRatio: defaultAspectRatio,
      style: "modern",
    });

    if (result) {
      onGenerated?.(result);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isGenerating}
      title={`${PLATFORM_CONFIGS[platform].name}용 이미지 생성`}
    >
      {isGenerating ? "⏳" : "🖼️"}
    </Button>
  );
}
