'use client';

import { useState, useCallback } from 'react';
import { NewsItem, QuickSummary, PlatformContent, Platform, StyleTemplate } from '@/types/news';
import { updateNewsItem } from '@/lib/storage';
import { AIProvider } from './useAIProvider';

const PROVIDER_STORAGE_KEY = 'ai-provider-preference';

function getSelectedProvider(): AIProvider | undefined {
  if (typeof window === 'undefined') return undefined;
  return (localStorage.getItem(PROVIDER_STORAGE_KEY) as AIProvider) || undefined;
}

export function useOpenAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3줄 핵심 요약 생성 (뉴스 수집 시 호출)
  const generateQuickSummary = useCallback(async (
    title: string,
    content: string
  ): Promise<QuickSummary | null> => {
    try {
      const provider = getSelectedProvider();
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'summarize',
          title,
          content,
          provider,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      return {
        bullets: data.bullets || [],
        category: data.category || 'other',
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Error generating summary:', err);
      return null;
    }
  }, []);

  // 특정 플랫폼용 콘텐츠 생성 (문체 템플릿 적용)
  const generatePlatformContent = useCallback(async (
    newsItem: NewsItem,
    platform: Platform,
    styleTemplate?: StyleTemplate | null
  ): Promise<PlatformContent | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const provider = getSelectedProvider();
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'generate',
          title: newsItem.title,
          content: newsItem.originalContent,
          url: newsItem.url,
          platform,
          provider,
          styleTemplate: styleTemplate ? {
            tone: styleTemplate.tone,
            characteristics: styleTemplate.characteristics,
            examples: styleTemplate.examples,
          } : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data = await response.json();
      return {
        content: data.content,
        charCount: data.charCount,
        hashtags: data.hashtags,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // 피드백 반영하여 콘텐츠 재생성
  const regenerateWithFeedback = useCallback(async (
    previousContent: string,
    feedback: string,
    platform: Platform
  ): Promise<PlatformContent | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const provider = getSelectedProvider();
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'regenerate',
          previousContent,
          feedback,
          platform,
          provider,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate content');
      }

      const data = await response.json();
      return {
        content: data.content,
        charCount: data.charCount,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // 뉴스 아이템에 요약 추가
  const addSummaryToNewsItem = useCallback(async (newsItem: NewsItem): Promise<NewsItem | null> => {
    const summary = await generateQuickSummary(newsItem.title, newsItem.originalContent);
    if (!summary) return null;

    updateNewsItem(newsItem.id, { quickSummary: summary });
    return { ...newsItem, quickSummary: summary };
  }, [generateQuickSummary]);

  return {
    isProcessing,
    error,
    generateQuickSummary,
    generatePlatformContent,
    regenerateWithFeedback,
    addSummaryToNewsItem,
  };
}
