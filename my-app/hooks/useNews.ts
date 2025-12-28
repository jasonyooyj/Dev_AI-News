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
  const toggleBookmarkInStore = useNewsStore((s) => s.toggleBookmark);

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

  // Toggle bookmark
  const toggleBookmark = useCallback(
    (id: string) => {
      const item = newsItems.find((n) => n.id === id);
      toggleBookmarkInStore(id);
      if (item?.isBookmarked) {
        toast.success('Bookmark removed');
      } else {
        toast.success('Bookmarked');
      }
    },
    [newsItems, toggleBookmarkInStore]
  );

  // Generate summary for a news item
  const generateSummary = useCallback(
    async (newsItem: NewsItem) => {
      if (newsItem.quickSummary) return newsItem;

      console.log(`[Summary] Starting for: ${newsItem.title}`);

      try {
        let content = newsItem.originalContent || '';
        console.log(`[Summary] Original content length: ${content.length}`);

        // If content is too short, try to scrape the full article
        if (content.trim().length < 200 && newsItem.url) {
          console.log(`[Summary] Content too short, scraping: ${newsItem.url}`);
          try {
            const scrapeResponse = await fetch('/api/scrape', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: newsItem.url }),
            });

            if (scrapeResponse.ok) {
              const scrapeData = await scrapeResponse.json();
              console.log(`[Summary] Scraped content length: ${scrapeData.content?.length || 0}`);

              if (scrapeData.content && scrapeData.content.length > content.length) {
                content = scrapeData.content;
                // Update the news item with the full content
                useNewsStore.getState().updateNewsItem(newsItem.id, {
                  originalContent: content,
                });
              }
            } else {
              console.error(`[Summary] Scrape failed with status: ${scrapeResponse.status}`);
            }
          } catch (e) {
            console.error('[Summary] Scrape error:', e);
          }
        }

        // If still no content, use title as fallback
        if (!content || content.trim().length < 50) {
          console.log('[Summary] Using title as content fallback');
          content = newsItem.title;
        }

        console.log(`[Summary] Final content length: ${content.length}, calling API...`);

        await summarizeMutation.mutateAsync({
          newsId: newsItem.id,
          title: newsItem.title,
          content: content,
        });

        console.log(`[Summary] Success for: ${newsItem.title}`);
        // Return updated item from store
        return useNewsStore.getState().newsItems.find((n) => n.id === newsItem.id) || null;
      } catch (error) {
        console.error(`[Summary] Failed for ${newsItem.title}:`, error);
        return null;
      }
    },
    [summarizeMutation]
  );

  // Generate summaries for multiple items (parallel with batching)
  const generateSummariesForItems = useCallback(
    async (items: NewsItem[]) => {
      const itemsToSummarize = items.filter(item => !item.quickSummary);
      console.log(`[Summary] Processing ${itemsToSummarize.length} items in parallel batches`);

      // Process in batches of 3 for better speed while avoiding rate limits
      const batchSize = 3;
      for (let i = 0; i < itemsToSummarize.length; i += batchSize) {
        const batch = itemsToSummarize.slice(i, i + batchSize);
        console.log(`[Summary] Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} items`);

        // Process batch in parallel
        await Promise.allSettled(
          batch.map(item => generateSummary(item))
        );

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < itemsToSummarize.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`[Summary] All batches complete`);
    },
    [generateSummary]
  );

  // Fetch from source (RSS or web scraping)
  const fetchFromRss = useCallback(
    async (source: Source, autoSummarize = true) => {
      // Both RSS and scraping are supported via the mutation
      try {
        await fetchRssMutation.mutateAsync({ source });

        // If auto summarize, run summaries for new items (with delay to avoid rate limiting)
        if (autoSummarize) {
          // Wait a bit for store to update
          await new Promise(resolve => setTimeout(resolve, 500));

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
    toggleBookmark,
    fetchFromRss,
    scrapeUrl,
    refreshNews,
    generateSummary,
    generateSummariesForItems,
    // Expose mutation states for UI
    isSummarizing: summarizeMutation.isPending,
  };
}
