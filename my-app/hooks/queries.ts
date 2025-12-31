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

// ============ Source Fetch Mutations (RSS + Scraping) ============
export function useFetchRss() {
  const updateSource = useSourcesStore((s) => s.updateSource);

  return useMutation({
    mutationFn: async ({ source }: { source: Source }) => {
      console.log(`[Fetch] Starting fetch for: ${source.name} (type: ${source.type})`);

      // Handle Threads profile sources
      if (source.type === 'threads') {
        console.log(`[Fetch] Using Threads profile scraping: ${source.websiteUrl}`);
        try {
          const result = await api.scrape.fetchThreadsProfile(source.websiteUrl, 10);
          console.log(`[Fetch] Got ${result.postsCount} posts from Threads profile`);

          return {
            source,
            items: result.posts.map(post => ({
              title: `${result.displayName}: ${post.content.substring(0, 80)}${post.content.length > 80 ? '...' : ''}`,
              link: post.postUrl,
              content: post.content,
              pubDate: post.timestamp || new Date().toISOString(),
              mediaUrls: post.mediaUrls,
            }))
          };
        } catch (err) {
          console.error(`[Fetch] Threads profile scrape failed:`, err);
          throw err;
        }
      }

      // Handle YouTube channel sources
      if (source.type === 'youtube') {
        console.log(`[Fetch] Using YouTube channel fetch: ${source.websiteUrl}`);
        try {
          const result = await api.scrape.fetchYouTubeChannel(source.websiteUrl, 10);
          console.log(`[Fetch] Got ${result.videosCount} videos from ${result.channelTitle}`);

          return {
            source,
            items: result.videos.map(video => ({
              title: video.title,
              link: video.link,
              content: video.description || `YouTube video from ${result.channelTitle}`,
              pubDate: video.publishedAt,
              mediaUrls: video.thumbnail ? [video.thumbnail] : [],
            }))
          };
        } catch (err) {
          console.error(`[Fetch] YouTube channel fetch failed:`, err);
          throw err;
        }
      }

      // If source has RSS, use RSS feed
      if (source.rssUrl) {
        console.log(`[Fetch] Using RSS: ${source.rssUrl}`);
        const result = await api.rss.fetch(source.rssUrl);
        console.log(`[Fetch] Got ${result.items.length} items from RSS`);

        return {
          source,
          items: result.items.map(item => {
            // Try multiple content sources
            let content = item.content || item.contentSnippet || '';

            // Log for debugging
            console.log(`[Fetch] Item: ${item.title?.substring(0, 50)}... | content length: ${content.length}`);

            return {
              title: item.title,
              link: item.link,
              content,
              pubDate: item.isoDate || item.pubDate,
            };
          })
        };
      }

      // Otherwise, scrape the website
      console.log(`[Fetch] Using scraping for: ${source.websiteUrl}`);

      try {
        const result = await api.scrape.fetchSource(source.websiteUrl, source.scrapeConfig);
        console.log(`[Fetch] Scrape found ${result.articles?.length || 0} articles`);

        if (!result.articles || result.articles.length === 0) {
          console.log('[Fetch] No articles found from scraping');
          return { source, items: [] };
        }

        // For scraped articles, fetch content sequentially with delays to avoid bot detection
        const itemsWithContent = [];
        const articlesToFetch = result.articles.slice(0, 5); // Limit to 5 to reduce load

        for (const article of articlesToFetch) {
          console.log(`[Fetch] Processing: ${article.title?.substring(0, 50)}...`);
          try {
            // Random delay between 1-3 seconds between requests
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

            const scraped = await api.scrape.fetch(article.link);
            console.log(`[Fetch] Scraped content length: ${scraped.content?.length || 0}`);

            itemsWithContent.push({
              title: article.title,
              link: article.link,
              content: scraped.content || article.description || '',
              pubDate: article.pubDate,
            });
          } catch (err) {
            console.error(`[Fetch] Failed to scrape article: ${article.link}`, err);
            // If scraping fails, still add the article with description as content
            itemsWithContent.push({
              title: article.title,
              link: article.link,
              content: article.description || '',
              pubDate: article.pubDate,
            });
          }
        }

        return { source, items: itemsWithContent };
      } catch (err) {
        console.error(`[Fetch] Scrape source failed:`, err);
        throw err;
      }
    },
    onSuccess: async ({ source, items }) => {
      // Get fresh state from store to avoid duplicates
      const currentNewsItems = useNewsStore.getState().newsItems;
      const addNewsItem = useNewsStore.getState().addNewsItem;

      let addedCount = 0;
      const existingUrls = new Set(currentNewsItems.map((n) => n.url));

      for (const item of items) {
        if (!existingUrls.has(item.link)) {
          await addNewsItem({
            sourceId: source.id,
            title: item.title,
            originalContent: item.content || '',
            url: item.link,
            publishedAt: item.pubDate || new Date().toISOString(),
            isProcessed: false,
            priority: source.priority || 'medium',
            mediaUrls: (item as { mediaUrls?: string[] }).mediaUrls || [],
          });
          existingUrls.add(item.link); // Prevent duplicates within same batch
          addedCount++;
        }
      }

      // Update lastFetchedAt for the source
      updateSource(source.id, { lastFetchedAt: new Date().toISOString() });

      const method = source.type === 'youtube' ? 'YouTube' : source.type === 'threads' ? 'Threads' : (source.rssUrl ? 'RSS' : 'scraping');
      toast.success(`Fetched ${addedCount} new articles from ${source.name} (${method})`);
    },
    onError: (error: ApiError) => {
      toast.error(`Failed to fetch: ${error.message}`);
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
          priority: defaultSource.priority || 'medium',
          mediaUrls: [],
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
