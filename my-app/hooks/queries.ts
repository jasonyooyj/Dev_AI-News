'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useNewsStore, useSourcesStore } from '@/store';
import { Platform, StyleTemplate, Source } from '@/types/news';

// ============ AI Mutations ============
export function useSummarize() {
  const addSummary = useNewsStore((s) => s.addSummary);

  return useMutation({
    mutationFn: async ({ newsId, title, content }: { newsId: string; title: string; content: string }) => {
      const result = await api.ai.summarize(title, content);
      return { newsId, result };
    },
    onSuccess: ({ newsId, result }) => {
      addSummary(newsId, {
        bullets: result.bullets,
        category: result.category as any,
        createdAt: new Date().toISOString(),
      });
      toast.success('Summary generated');
    },
    onError: (error: ApiError) => {
      toast.error(`Failed to summarize: ${error.message}`);
    },
  });
}

export function useGenerateContent() {
  return useMutation({
    mutationFn: async ({
      title,
      content,
      platform,
      url,
      styleTemplate,
    }: {
      title: string;
      content: string;
      platform: Platform;
      url?: string;
      styleTemplate?: StyleTemplate;
    }) => {
      return api.ai.generate(title, content, platform, {
        url,
        styleTemplate: styleTemplate
          ? {
              tone: styleTemplate.tone,
              characteristics: styleTemplate.characteristics,
              examples: styleTemplate.examples,
            }
          : undefined,
      });
    },
    onSuccess: () => {
      toast.success('Content generated');
    },
    onError: (error: ApiError) => {
      toast.error(`Failed to generate: ${error.message}`);
    },
  });
}

export function useRegenerateContent() {
  return useMutation({
    mutationFn: async ({
      previousContent,
      feedback,
      platform,
    }: {
      previousContent: string;
      feedback: string;
      platform: Platform;
    }) => {
      return api.ai.regenerate(previousContent, feedback, platform);
    },
    onSuccess: () => {
      toast.success('Content regenerated');
    },
    onError: (error: ApiError) => {
      toast.error(`Failed to regenerate: ${error.message}`);
    },
  });
}

export function useAnalyzeStyle() {
  return useMutation({
    mutationFn: async (examples: string[]) => {
      return api.ai.analyzeStyle(examples);
    },
    onSuccess: () => {
      toast.success('Style analyzed');
    },
    onError: (error: ApiError) => {
      toast.error(`Failed to analyze style: ${error.message}`);
    },
  });
}

// ============ RSS Feed Mutations ============
export function useFetchRss() {
  const addNewsItem = useNewsStore((s) => s.addNewsItem);
  const newsItems = useNewsStore((s) => s.newsItems);
  const updateSource = useSourcesStore((s) => s.updateSource);

  return useMutation({
    mutationFn: async ({ source }: { source: Source }) => {
      if (!source.rssUrl) throw new Error('Source has no RSS URL');
      const result = await api.rss.fetch(source.rssUrl);
      return { source, items: result.items };
    },
    onSuccess: ({ source, items }) => {
      let addedCount = 0;
      items.forEach((item) => {
        const existingUrls = newsItems.map((n) => n.url);
        if (!existingUrls.includes(item.link)) {
          addNewsItem({
            sourceId: source.id,
            title: item.title,
            originalContent: item.content || item.contentSnippet || '',
            url: item.link,
            publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
            isProcessed: false,
          });
          addedCount++;
        }
      });
      // Update lastFetchedAt for the source
      updateSource(source.id, { lastFetchedAt: new Date().toISOString() });
      toast.success(`Fetched ${addedCount} new articles from ${source.name}`);
    },
    onError: (error: ApiError) => {
      toast.error(`Failed to fetch RSS: ${error.message}`);
    },
  });
}

// ============ Scrape Mutations ============
export function useScrapeUrl() {
  const addNewsItem = useNewsStore((s) => s.addNewsItem);
  const sources = useSourcesStore((s) => s.sources);

  return useMutation({
    mutationFn: async (url: string) => {
      return api.scrape.fetch(url);
    },
    onSuccess: (result, url) => {
      const defaultSource = sources.find((s) => s.isActive);
      if (defaultSource) {
        addNewsItem({
          sourceId: defaultSource.id,
          title: result.title,
          originalContent: result.content,
          url,
          publishedAt: new Date().toISOString(),
          isProcessed: false,
        });
        toast.success('Article scraped and saved');
      } else {
        toast.error('No active source to save to');
      }
    },
    onError: (error: ApiError) => {
      toast.error(`Failed to scrape: ${error.message}`);
    },
  });
}
