import { useState, useEffect, useCallback } from "react";

export interface SavedImage {
  id: string;
  base64: string;
  mimeType: string;
  headline: string;
  platform: string;
  aspectRatio: string;
  width: number;
  height: number;
  createdAt: string;
}

const STORAGE_KEY = "ai-news-image-gallery";
const MAX_IMAGES = 50; // 최대 저장 개수

export function useImageGallery() {
  const [images, setImages] = useState<SavedImage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setImages(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.error("Failed to load image gallery:", err);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  const saveToStorage = useCallback((newImages: SavedImage[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newImages));
    } catch (err) {
      console.error("Failed to save image gallery:", err);
      // localStorage가 가득 찼을 경우 오래된 이미지 삭제
      if (err instanceof DOMException && err.name === "QuotaExceededError") {
        const trimmed = newImages.slice(0, Math.floor(newImages.length / 2));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        setImages(trimmed);
      }
    }
  }, []);

  // Add new image
  const addImage = useCallback((image: Omit<SavedImage, "id" | "createdAt">) => {
    const newImage: SavedImage = {
      ...image,
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    setImages((prev) => {
      // 최대 개수 초과 시 오래된 것 삭제
      const updated = [newImage, ...prev].slice(0, MAX_IMAGES);
      saveToStorage(updated);
      return updated;
    });

    return newImage;
  }, [saveToStorage]);

  // Delete image
  const deleteImage = useCallback((id: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Clear all images
  const clearAll = useCallback(() => {
    setImages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get total size in MB (approximate)
  const getTotalSize = useCallback(() => {
    const totalBytes = images.reduce((acc, img) => {
      return acc + (img.base64?.length || 0) * 0.75; // base64 to bytes approximation
    }, 0);
    return (totalBytes / (1024 * 1024)).toFixed(2);
  }, [images]);

  return {
    images,
    isLoaded,
    addImage,
    deleteImage,
    clearAll,
    getTotalSize,
    count: images.length,
  };
}
