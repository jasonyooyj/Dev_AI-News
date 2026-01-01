'use client';

import { useCallback } from 'react';
import { NewsItem, Platform } from '@/types/news';
import { useNewsStore } from '@/store';
import { useSummarize, useGenerateContent, useRegenerateContent } from './queries';

/**
 * useAI - AI content generation using Gemini via TanStack Query mutations
 *
 * All API calls now go through TanStack Query with:
 * - Automatic error handling with toast notifications
 * - Loading state management
 */
export function useAI() {
  // TanStack Query mutations
  const summarizeMutation = useSummarize();
  const generateMutation = useGenerateContent();
  const regenerateMutation = useRegenerateContent();

  // Combined loading state
  const isProcessing =
    summarizeMutation.isPending ||
    generateMutation.isPending ||
    regenerateMutation.isPending;

  // Combined error state
  const error =
    summarizeMutation.error?.message ||
    generateMutation.error?.message ||
    regenerateMutation.error?.message ||
    null;

  // Generate quick summary (3-bullet summary for news collection)
  const generateQuickSummary = useCallback(
    async (title: string, content: string) => {
      try {
        const result = await summarizeMutation.mutateAsync({
          newsId: '', // No newsId when called directly
          title,
          content,
        });
        return {
          bullets: result.result.bullets || [],
          category: result.result.category || 'other',
          createdAt: new Date().toISOString(),
        };
      } catch {
        return null;
      }
    },
    [summarizeMutation]
  );

  // Generate platform-specific content
  const generatePlatformContent = useCallback(
    async (
      newsItem: NewsItem,
      platform: Platform,
      sourceName?: string
    ) => {
      try {
        const result = await generateMutation.mutateAsync({
          title: newsItem.title,
          content: newsItem.originalContent,
          platform,
          url: newsItem.url,
          sourceName,
        });
        return {
          content: result.content,
          charCount: result.charCount,
          hashtags: result.hashtags,
        };
      } catch {
        return null;
      }
    },
    [generateMutation]
  );

  // Regenerate content with feedback
  const regenerateWithFeedback = useCallback(
    async (previousContent: string, feedback: string, platform: Platform) => {
      try {
        const result = await regenerateMutation.mutateAsync({
          previousContent,
          feedback,
          platform,
        });
        return {
          content: result.content,
          charCount: result.charCount,
        };
      } catch {
        return null;
      }
    },
    [regenerateMutation]
  );

  // Add summary to news item
  const addSummaryToNewsItem = useCallback(
    async (newsItem: NewsItem) => {
      try {
        await summarizeMutation.mutateAsync({
          newsId: newsItem.id,
          title: newsItem.title,
          content: newsItem.originalContent,
        });
        // Return updated item from store
        return useNewsStore.getState().newsItems.find((n) => n.id === newsItem.id) || null;
      } catch {
        return null;
      }
    },
    [summarizeMutation]
  );

  return {
    isProcessing,
    error,
    generateQuickSummary,
    generatePlatformContent,
    regenerateWithFeedback,
    addSummaryToNewsItem,
    // Expose mutation states for more granular control
    isSummarizing: summarizeMutation.isPending,
    isGenerating: generateMutation.isPending,
    isRegenerating: regenerateMutation.isPending,
  };
}
