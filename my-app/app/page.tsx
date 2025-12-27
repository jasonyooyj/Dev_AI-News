'use client';

import { useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { NewsList } from '@/components/news/NewsList';
import { NewsDetail } from '@/components/news/NewsDetail';
import { RssFetcher } from '@/components/collect/RssFetcher';
import { UrlScraper } from '@/components/collect/UrlScraper';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSources } from '@/hooks/useSources';
import { useNews } from '@/hooks/useNews';
import { useOpenAI } from '@/hooks/useOpenAI';
import { NewsItem, ProcessedNews, Source } from '@/types/news';
import { getProcessedNewsByNewsId } from '@/lib/storage';

interface FetchResult {
  sourceId: string;
  sourceName: string;
  success: boolean;
  itemsFetched?: number;
  error?: string;
}

interface ScrapeResult {
  success: boolean;
  title?: string;
  content?: string;
  error?: string;
}

export default function DashboardPage() {
  const { sources, isLoading: sourcesLoading } = useSources();
  const { newsItems, isLoading: newsLoading, fetchFromRss, scrapeUrl, deleteNewsItem, refreshNews, addNewsItem } = useNews();
  const { processNews, isProcessing } = useOpenAI();

  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedNews | null>(null);
  const [activeTab, setActiveTab] = useState<'news' | 'collect'>('news');
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const activeSources = sources.filter((s) => s.isActive);

  const handleViewNews = (newsItem: NewsItem) => {
    setSelectedNews(newsItem);
    const processed = getProcessedNewsByNewsId(newsItem.id);
    setProcessedData(processed || null);
  };

  const handleProcessNews = async (newsItem: NewsItem) => {
    setProcessingIds((prev) => [...prev, newsItem.id]);
    try {
      const result = await processNews(newsItem);
      if (result) {
        setProcessedData(result);
        refreshNews();
      }
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== newsItem.id));
    }
  };

  const handleDeleteNews = (newsItem: NewsItem) => {
    deleteNewsItem(newsItem.id);
    if (selectedNews?.id === newsItem.id) {
      setSelectedNews(null);
      setProcessedData(null);
    }
  };

  // RssFetcher handlers
  const handleFetchSource = useCallback(async (source: Source): Promise<FetchResult> => {
    try {
      const items = await fetchFromRss(source);
      return {
        sourceId: source.id,
        sourceName: source.name,
        success: true,
        itemsFetched: items.length,
      };
    } catch (error) {
      return {
        sourceId: source.id,
        sourceName: source.name,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch',
      };
    }
  }, [fetchFromRss]);

  const handleFetchAll = useCallback(async (): Promise<FetchResult[]> => {
    const rssSources = activeSources.filter((s) => s.rssUrl);
    const results: FetchResult[] = [];

    for (const source of rssSources) {
      const result = await handleFetchSource(source);
      results.push(result);
    }

    return results;
  }, [activeSources, handleFetchSource]);

  // UrlScraper handlers
  const handleScrape = useCallback(async (url: string): Promise<ScrapeResult> => {
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error('Failed to scrape URL');

      const data = await response.json();
      return {
        success: true,
        title: data.title,
        content: data.content,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape',
      };
    }
  }, []);

  const handleSaveScrapedContent = useCallback((data: { url: string; title: string; content: string }) => {
    const defaultSource = activeSources[0];
    if (defaultSource) {
      addNewsItem({
        sourceId: defaultSource.id,
        title: data.title,
        originalContent: data.content,
        url: data.url,
        publishedAt: new Date().toISOString(),
      });
    }
  }, [activeSources, addNewsItem]);

  if (sourcesLoading || newsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{newsItems.length}</div>
              <div className="text-sm text-muted-foreground">Total News</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {newsItems.filter((n) => n.isProcessed).length}
              </div>
              <div className="text-sm text-muted-foreground">Processed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-600">
                {newsItems.filter((n) => !n.isProcessed).length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{activeSources.length}</div>
              <div className="text-sm text-muted-foreground">Active Sources</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border pb-2">
          <Button
            variant={activeTab === 'news' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('news')}
          >
            News Feed
          </Button>
          <Button
            variant={activeTab === 'collect' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('collect')}
          >
            Collect News
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'news' ? (
          <NewsList
            news={newsItems}
            sources={sources}
            onView={handleViewNews}
            onProcess={handleProcessNews}
            onDelete={handleDeleteNews}
            processingIds={processingIds}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RssFetcher
              sources={activeSources}
              onFetchAll={handleFetchAll}
              onFetchSource={handleFetchSource}
            />
            <UrlScraper
              onScrape={handleScrape}
              onSave={handleSaveScrapedContent}
            />
          </div>
        )}

        {/* News Detail Modal */}
        <NewsDetail
          isOpen={selectedNews !== null}
          news={selectedNews}
          processedNews={processedData}
          source={selectedNews ? sources.find((s) => s.id === selectedNews.sourceId) : undefined}
          onClose={() => {
            setSelectedNews(null);
            setProcessedData(null);
          }}
          onProcess={handleProcessNews}
          isProcessing={isProcessing}
        />
      </div>
    </MainLayout>
  );
}
