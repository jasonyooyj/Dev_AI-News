'use client';

import { useState, useCallback } from 'react';
import { NewsItem, ProcessedNews, Platform } from '@/types/news';
import { addProcessedNews, updateNewsItem } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export function useOpenAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processNews = useCallback(async (newsItem: NewsItem): Promise<ProcessedNews | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newsItem.title,
          content: newsItem.originalContent,
          url: newsItem.url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process with AI');
      }

      const data = await response.json();

      const processed: ProcessedNews = {
        id: uuidv4(),
        newsItemId: newsItem.id,
        summary: data.summary,
        platforms: data.platforms,
        createdAt: new Date().toISOString(),
      };

      addProcessedNews(processed);
      updateNewsItem(newsItem.id, { isProcessed: true });

      return processed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const regenerateForPlatform = useCallback(async (
    newsItem: NewsItem,
    platform: Platform,
    customPrompt?: string
  ): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newsItem.title,
          content: newsItem.originalContent,
          url: newsItem.url,
          platform,
          customPrompt,
        }),
      });

      if (!response.ok) throw new Error('Failed to regenerate');

      const data = await response.json();
      return data.content;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    error,
    processNews,
    regenerateForPlatform,
  };
}
