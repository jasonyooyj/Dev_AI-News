'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useNewsStore, useSourcesStore } from '@/store';
import { useSummarize, useFetchRss, useScrapeUrl } from './queries';
import { NewsItem, Source } from '@/types/news';

/**
 * useNews - Migrated to use Zustand store + TanStack Query
 *
 * State from Zustand store (auto-persisted to localStorage)
 * Mutations from TanStack Query (with toast notifications)
 */
export function useNews() {
  // Zustand store state
  const newsItems = useNewsStore((s) => s.newsItems);
  const addNewsItemToStore = useNewsStore((s) => s.addNewsItem);
  const updateNewsItemInStore = useNewsStore((s) => s.updateNewsItem);
  const deleteNewsItemFromStore = useNewsStore((s) => s.deleteNewsItem);

  // TanStack Query mutations
  const summarizeMutation = useSummarize();
  const fetchRssMutation = useFetchRss();
  const scrapeUrlMutation = useScrapeUrl();

  // Loading states
  const isLoading = false; // Zustand hydrates synchronously
  const isFetching = fetchRssMutation.isPending || scrapeUrlMutation.isPending;
  const summarizingIds = summarizeMutation.isPending
    ? [summarizeMutation.variables?.newsId].filter(Boolean) as string[]
    : [];

  // Add news item
  const addNewsItem = useCallback(
    (data: Omit<NewsItem, 'id' | 'createdAt' | 'isProcessed'>) => {
      addNewsItemToStore({
        ...data,
        isProcessed: false,
      });
    },
    [addNewsItemToStore]
  );

  // Update news item
  const updateNewsItem = useCallback(
    (id: string, updates: Partial<NewsItem>) => {
      updateNewsItemInStore(id, updates);
    },
    [updateNewsItemInStore]
  );

  // Delete news item
  const deleteNewsItem = useCallback(
    (id: string) => {
      deleteNewsItemFromStore(id);
      toast.success('News deleted');
    },
    [deleteNewsItemFromStore]
  );

  // Generate summary for a news item
  const generateSummary = useCallback(
    async (newsItem: NewsItem) => {
      if (newsItem.quickSummary) return newsItem;

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

  // Generate summaries for multiple items
  const generateSummariesForItems = useCallback(
    async (items: NewsItem[]) => {
      for (const item of items) {
        if (!item.quickSummary) {
          await generateSummary(item);
        }
      }
    },
    [generateSummary]
  );

  // Fetch from RSS
  const fetchFromRss = useCallback(
    async (source: Source, autoSummarize = true) => {
      if (!source.rssUrl) return [];

      try {
        await fetchRssMutation.mutateAsync({ source });

        // If auto summarize, run summaries for new items
        if (autoSummarize) {
          const items = useNewsStore.getState().newsItems.filter(
            (n) => n.sourceId === source.id && !n.quickSummary
          );
          // Don't await - run in background
          generateSummariesForItems(items);
        }

        return useNewsStore.getState().newsItems.filter((n) => n.sourceId === source.id);
      } catch {
        return [];
      }
    },
    [fetchRssMutation, generateSummariesForItems]
  );

  // Scrape URL
  const scrapeUrl = useCallback(
    async (url: string, sourceId: string, autoSummarize = true) => {
      try {
        await scrapeUrlMutation.mutateAsync(url);

        if (autoSummarize) {
          const items = useNewsStore.getState().newsItems;
          const newItem = items.find((n) => n.url === url);
          if (newItem && !newItem.quickSummary) {
            generateSummary(newItem);
          }
        }

        return useNewsStore.getState().newsItems.find((n) => n.url === url) || null;
      } catch {
        return null;
      }
    },
    [scrapeUrlMutation, generateSummary]
  );

  // Refresh news (no-op with Zustand - state is always fresh)
  const refreshNews = useCallback(() => {
    // Zustand state is reactive, no refresh needed
  }, []);

  return {
    newsItems,
    processedNews: [], // Deprecated - use generatedContents in NewsDetail
    isLoading,
    isFetching,
    summarizingIds,
    addNewsItem,
    updateNewsItem,
    deleteNewsItem,
    fetchFromRss,
    scrapeUrl,
    refreshNews,
    generateSummary,
    generateSummariesForItems,
    // Expose mutation states for UI
    isSummarizing: summarizeMutation.isPending,
  };
}
