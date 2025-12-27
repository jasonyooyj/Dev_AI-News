'use client';

import { useState, useEffect, useCallback } from 'react';
import { NewsItem, ProcessedNews, Source, QuickSummary } from '@/types/news';
import {
  getNewsItems,
  saveNewsItems,
  addNewsItem as addNewsItemToStorage,
  updateNewsItem as updateNewsItemInStorage,
  deleteNewsItem as deleteNewsItemFromStorage,
  getProcessedNews,
  addProcessedNews as addProcessedNewsToStorage,
  getProcessedNewsByNewsId,
} from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export function useNews() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [processedNews, setProcessedNews] = useState<ProcessedNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [summarizingIds, setSummarizingIds] = useState<string[]>([]);

  useEffect(() => {
    setNewsItems(getNewsItems());
    setProcessedNews(getProcessedNews());
    setIsLoading(false);
  }, []);

  const addNewsItem = useCallback((data: Omit<NewsItem, 'id' | 'createdAt' | 'isProcessed'>) => {
    const newItem: NewsItem = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      isProcessed: false,
    };
    addNewsItemToStorage(newItem);
    setNewsItems(getNewsItems());
    return newItem;
  }, []);

  const updateNewsItem = useCallback((id: string, updates: Partial<NewsItem>) => {
    updateNewsItemInStorage(id, updates);
    setNewsItems(getNewsItems());
  }, []);

  const deleteNewsItem = useCallback((id: string) => {
    deleteNewsItemFromStorage(id);
    setNewsItems(getNewsItems());
  }, []);

  // 개별 뉴스 아이템에 대한 요약 생성
  const generateSummary = useCallback(async (newsItem: NewsItem): Promise<NewsItem | null> => {
    if (newsItem.quickSummary) return newsItem;

    setSummarizingIds((prev) => [...prev, newsItem.id]);
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'summarize',
          title: newsItem.title,
          content: newsItem.originalContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      const summary: QuickSummary = {
        bullets: data.bullets || [],
        category: data.category || 'other',
        createdAt: new Date().toISOString(),
      };

      updateNewsItemInStorage(newsItem.id, { quickSummary: summary });
      setNewsItems(getNewsItems());
      return { ...newsItem, quickSummary: summary };
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    } finally {
      setSummarizingIds((prev) => prev.filter((id) => id !== newsItem.id));
    }
  }, []);

  // 여러 뉴스 아이템에 대한 요약 일괄 생성
  const generateSummariesForItems = useCallback(async (items: NewsItem[]): Promise<void> => {
    for (const item of items) {
      await generateSummary(item);
    }
  }, [generateSummary]);

  const fetchFromRss = useCallback(async (source: Source, autoSummarize = true) => {
    if (!source.rssUrl) return [];

    setIsFetching(true);
    try {
      const response = await fetch('/api/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: source.rssUrl }),
      });

      if (!response.ok) throw new Error('Failed to fetch RSS');

      const data = await response.json();
      const newItems: NewsItem[] = [];

      for (const item of data.items || []) {
        const exists = newsItems.some((n) => n.url === item.link);
        if (!exists) {
          const newsItem = addNewsItem({
            sourceId: source.id,
            title: item.title || 'Untitled',
            originalContent: item.contentSnippet || item.content || '',
            url: item.link || '',
            publishedAt: item.pubDate,
          });
          newItems.push(newsItem);
        }
      }

      // 자동 요약 생성
      if (autoSummarize && newItems.length > 0) {
        generateSummariesForItems(newItems);
      }

      return newItems;
    } catch (error) {
      console.error('Error fetching RSS:', error);
      return [];
    } finally {
      setIsFetching(false);
    }
  }, [newsItems, addNewsItem, generateSummariesForItems]);

  const scrapeUrl = useCallback(async (url: string, sourceId: string, autoSummarize = true) => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error('Failed to scrape URL');

      const data = await response.json();

      const newsItem = addNewsItem({
        sourceId,
        title: data.title || 'Untitled',
        originalContent: data.content || '',
        url,
        publishedAt: new Date().toISOString(),
      });

      // 자동 요약 생성
      if (autoSummarize) {
        generateSummary(newsItem);
      }

      return newsItem;
    } catch (error) {
      console.error('Error scraping URL:', error);
      return null;
    } finally {
      setIsFetching(false);
    }
  }, [addNewsItem, generateSummary]);

  const refreshNews = useCallback(() => {
    setNewsItems(getNewsItems());
    setProcessedNews(getProcessedNews());
  }, []);

  const getProcessedForNews = useCallback((newsItemId: string) => {
    return getProcessedNewsByNewsId(newsItemId);
  }, []);

  return {
    newsItems,
    processedNews,
    isLoading,
    isFetching,
    summarizingIds,
    addNewsItem,
    updateNewsItem,
    deleteNewsItem,
    fetchFromRss,
    scrapeUrl,
    refreshNews,
    getProcessedForNews,
    generateSummary,
    generateSummariesForItems,
  };
}
