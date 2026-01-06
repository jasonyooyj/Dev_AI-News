"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles, RefreshCw, Loader2, Palette, Download, Copy, ImageIcon, Images, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Platform,
  GeneratedImage,
  PLATFORM_IMAGE_SIZES,
  PLATFORM_CONFIGS,
} from "@/types/news";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useImageGallery, SavedImage } from "@/hooks/useImageGallery";

interface ImageGeneratorProps {
  headline: string;
  summary?: string;
  originalContent?: string;
  platforms?: Platform[];
  onImageGenerated?: (platform: Platform, image: GeneratedImage) => void;
  autoFetchSuggestions?: boolean;
}

interface HeadlineSuggestion {
  main: string;
  alternatives: string[];
}

export function ImageGenerator({
  headline: initialHeadline,
  summary,
  originalContent,
  platforms = ["twitter", "threads", "instagram", "linkedin", "bluesky"],
  onImageGenerated,
  autoFetchSuggestions = false,
}: ImageGeneratorProps) {
  const { isGenerating, error, generateImage, getSizes } = useImageGeneration();
  const { images: galleryImages, addImage, deleteImage, clearAll, count: galleryCount, getTotalSize } = useImageGallery();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(platforms[0]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("9:16");
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  // Editable headline state - use ref to track if user has edited
  const [editableHeadline, setEditableHeadline] = useState(initialHeadline || "");
  const [suggestions, setSuggestions] = useState<HeadlineSuggestion | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasUserEdited, setHasUserEdited] = useState(false);

  // Only update from prop if user hasn't manually edited
  useEffect(() => {
    if (!hasUserEdited && initialHeadline) {
      setEditableHeadline(initialHeadline);
    }
  }, [initialHeadline, hasUserEdited]);

  // Reset hasUserEdited when modal closes/reopens (initialHeadline changes significantly)
  useEffect(() => {
    setHasUserEdited(false);
  }, [initialHeadline]);

  // Handle user input
  const handleHeadlineChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableHeadline(e.target.value);
    setHasUserEdited(true);
  }, []);

  const platformSizes = getSizes(selectedPlatform);

  const handlePlatformChange = useCallback((platform: Platform) => {
    setSelectedPlatform(platform);
    const sizes = PLATFORM_IMAGE_SIZES[platform];
    if (sizes && sizes.length > 0) {
      setSelectedAspectRatio(sizes[0].aspectRatio);
    }
    setGeneratedImage(null);
  }, []);

  const handleGenerateSuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch("/api/headline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: initialHeadline,
          content: originalContent || summary,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate suggestions");
      }

      const data = await response.json();
      setSuggestions(data);
      // Auto-select the main suggestion
      if (data.main) {
        setEditableHeadline(data.main.replace(/\\n/g, "\n"));
      }
    } catch (err) {
      console.error("Failed to generate headline suggestions:", err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [initialHeadline, summary, originalContent]);

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setEditableHeadline(suggestion.replace(/\\n/g, "\n"));
    setHasUserEdited(true);
  }, []);

  // Auto-fetch suggestions on mount if enabled
  useEffect(() => {
    if (autoFetchSuggestions && initialHeadline && !suggestions) {
      handleGenerateSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetchSuggestions]);

  const handleGenerate = useCallback(async () => {
    const result = await generateImage({
      headline: editableHeadline,
      summary,
      platform: selectedPlatform,
      aspectRatio: selectedAspectRatio,
    });

    if (result) {
      setGeneratedImage(result);
      onImageGenerated?.(selectedPlatform, result);

      // 갤러리에 저장
      addImage({
        base64: result.base64,
        mimeType: result.mimeType,
        headline: editableHeadline,
        platform: selectedPlatform,
        aspectRatio: selectedAspectRatio,
        width: result.width,
        height: result.height,
      });
    }
  }, [
    generateImage,
    editableHeadline,
    summary,
    selectedPlatform,
    selectedAspectRatio,
    onImageGenerated,
    addImage,
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
      {/* 헤드라인 편집 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-foreground">
            헤드라인 (이미지에 표시됨)
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerateSuggestions}
            disabled={isLoadingSuggestions}
            className="text-xs"
          >
            {isLoadingSuggestions ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-1" />
                AI 추천
              </>
            )}
          </Button>
        </div>

        <textarea
          value={editableHeadline}
          onChange={handleHeadlineChange}
          className="w-full p-3 bg-white dark:bg-zinc-900 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 border-2 border-zinc-300 dark:border-zinc-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none resize-vertical min-h-[80px]"
          rows={3}
          placeholder="이미지에 표시될 헤드라인을 입력하세요"
          autoComplete="off"
          spellCheck={false}
        />

        <p className="mt-1 text-xs text-muted-foreground">
          팁: 2줄 이하, 줄당 10~12자가 가장 효과적입니다
        </p>
      </div>

      {/* AI 추천 헤드라인 */}
      {suggestions && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            AI 추천 헤드라인
          </label>
          <div className="space-y-1.5">
            {/* Main suggestion */}
            <button
              onClick={() => handleSelectSuggestion(suggestions.main)}
              className={`w-full p-2.5 text-left text-sm rounded-lg border transition-all ${
                editableHeadline === suggestions.main.replace(/\\n/g, "\n")
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-card"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded">
                  추천
                </span>
                <span className="whitespace-pre-wrap">{suggestions.main.replace(/\\n/g, "\n")}</span>
              </div>
            </button>

            {/* Alternative suggestions */}
            {suggestions.alternatives.map((alt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(alt)}
                className={`w-full p-2.5 text-left text-sm rounded-lg border transition-all ${
                  editableHeadline === alt.replace(/\\n/g, "\n")
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 bg-card"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">
                    {idx + 1}
                  </span>
                  <span className="whitespace-pre-wrap">{alt.replace(/\\n/g, "\n")}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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

      {/* 생성 버튼 */}
      <Button
        variant="primary"
        className="w-full"
        onClick={handleGenerate}
        disabled={isGenerating || !editableHeadline.trim()}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            이미지 생성 중...
          </>
        ) : (
          <>
            <Palette className="w-4 h-4 mr-2" />
            이미지 생성하기
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
                <Download className="w-4 h-4 mr-1" />
                다운로드
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={handleCopyToClipboard}
              >
                <Copy className="w-4 h-4 mr-1" />
                복사
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 갤러리 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowGallery(true)}
        className="w-full text-muted-foreground"
      >
        <Images className="w-4 h-4 mr-2" />
        저장된 이미지 보기 ({galleryCount}개)
      </Button>

      {/* 갤러리 모달 */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowGallery(false)}
          />
          <div className="relative z-10 w-full max-w-4xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  이미지 갤러리
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {galleryCount}개 이미지 • {getTotalSize()}MB
                </p>
              </div>
              <div className="flex items-center gap-2">
                {galleryCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("모든 이미지를 삭제하시겠습니까?")) {
                        clearAll();
                      }
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    전체 삭제
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGallery(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* 갤러리 그리드 */}
            <div className="flex-1 overflow-y-auto p-4">
              {galleryCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Images className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" />
                  <p className="text-zinc-500 dark:text-zinc-400">
                    아직 저장된 이미지가 없습니다
                  </p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                    이미지를 생성하면 자동으로 저장됩니다
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {galleryImages.map((img) => (
                    <GalleryImageCard
                      key={img.id}
                      image={img}
                      onDelete={() => deleteImage(img.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 갤러리 이미지 카드 컴포넌트
interface GalleryImageCardProps {
  image: SavedImage;
  onDelete: () => void;
}

function GalleryImageCard({ image, onDelete }: GalleryImageCardProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `data:${image.mimeType};base64,${image.base64}`;
    link.download = `${image.platform}-${image.aspectRatio.replace(":", "x")}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    try {
      const response = await fetch(`data:${image.mimeType};base64,${image.base64}`);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [image.mimeType]: blob }),
      ]);
      alert("이미지가 클립보드에 복사되었습니다!");
    } catch (err) {
      console.error("Failed to copy image:", err);
    }
  };

  const formattedDate = new Date(image.createdAt).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group relative rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
      <div className="aspect-[9/16] relative">
        <img
          src={`data:${image.mimeType};base64,${image.base64}`}
          alt={image.headline}
          className="w-full h-full object-cover"
        />
        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={handleDownload}
            className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            title="다운로드"
          >
            <Download className="w-4 h-4 text-zinc-700" />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            title="복사"
          >
            <Copy className="w-4 h-4 text-zinc-700" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-red-500/90 rounded-full hover:bg-red-500 transition-colors"
            title="삭제"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      {/* 정보 */}
      <div className="p-2">
        <p className="text-xs text-zinc-900 dark:text-zinc-100 font-medium line-clamp-2 mb-1">
          {image.headline}
        </p>
        <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
          <span>{PLATFORM_CONFIGS[image.platform as Platform]?.name || image.platform}</span>
          <span>{formattedDate}</span>
        </div>
      </div>
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
  const defaultAspectRatio = sizes?.[0]?.aspectRatio || "9:16";

  const handleClick = async () => {
    const result = await generateImage({
      headline,
      summary,
      platform,
      aspectRatio: defaultAspectRatio,
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
      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
    </Button>
  );
}
