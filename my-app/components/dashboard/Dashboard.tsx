'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { NewsList } from '@/components/news/NewsList';
import { NewsDetail } from '@/components/news/NewsDetail';
import { ContentFetcher } from '@/components/collect/ContentFetcher';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useSources } from '@/hooks/useSources';
import { useNews } from '@/hooks/useNews';
import { useAI } from '@/hooks/useAI';
import { useNewsStore, useUIStore } from '@/store';
import { NewsItem, Source, Platform, PlatformContent } from '@/types/news';

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

export function Dashboard() {
  const { sources, isLoading: sourcesLoading } = useSources();
  const { newsItems, isLoading: newsLoading, fetchFromRss, deleteNewsItem, toggleBookmark, refreshNews, addNewsItem } = useNews();
  const { generatePlatformContent, regenerateWithFeedback } = useAI();
  const saveGeneratedContent = useNewsStore((s) => s.saveGeneratedContent);
  const { lastReadAt, fetchLastReadAt, markAllAsRead } = useUIStore();

  // Fetch lastReadAt on mount
  useEffect(() => {
    fetchLastReadAt();
  }, [fetchLastReadAt]);

  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  // Get the actual news item from store (stays in sync with updates)
  const selectedNews = selectedNewsId ? newsItems.find(n => n.id === selectedNewsId) || null : null;
  const [activeTab, setActiveTab] = useState<'news' | 'collect'>('news');
  const [summarizingIds] = useState<string[]>([]);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedContents, setGeneratedContents] = useState<Partial<Record<Platform, PlatformContent>>>({});
  const [isRefreshingSources, setIsRefreshingSources] = useState(false);

  // Memoized statistics calculations
  const activeSources = useMemo(() => sources.filter((s) => s.isActive), [sources]);

  const stats = useMemo(() => ({
    total: newsItems.length,
    summarized: newsItems.filter((n) => n.quickSummary && n.quickSummary.bullets.length > 0).length,
    pending: newsItems.filter((n) => !n.quickSummary || n.quickSummary.bullets.length === 0).length,
    bookmarked: newsItems.filter((n) => n.isBookmarked).length,
    activeSources: activeSources.length,
  }), [newsItems, activeSources]);

  const handleViewNews = (newsItem: NewsItem) => {
    setSelectedNewsId(newsItem.id);
    // Load saved generated contents from the news item
    setGeneratedContents(newsItem.generatedContents || {});
  };

  const handleGenerateContent = async (
    platform: Platform
  ): Promise<PlatformContent | null> => {
    if (!selectedNews) return null;

    setIsGeneratingContent(true);
    try {
      // Get source name for attribution
      const source = sources.find((s) => s.id === selectedNews.sourceId);
      const sourceName = source?.name;

      const result = await generatePlatformContent(selectedNews, platform, sourceName);
      if (result) {
        // Update local state
        setGeneratedContents((prev) => ({
          ...prev,
          [platform]: result,
        }));
        // Save to DB for persistence
        await saveGeneratedContent(selectedNews.id, platform, result);
        return result;
      }
      return null;
    } catch (error) {
      console.error('Failed to generate content:', error);
      return null;
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleRegenerateWithFeedback = async (
    platform: Platform,
    feedback: string
  ): Promise<PlatformContent | null> => {
    if (!selectedNews) return null;

    const currentContent = generatedContents[platform];
    if (!currentContent) return null;

    setIsGeneratingContent(true);
    try {
      const result = await regenerateWithFeedback(currentContent.content, feedback, platform);
      if (result) {
        // Update local state
        setGeneratedContents((prev) => ({
          ...prev,
          [platform]: result,
        }));
        // Save to DB for persistence
        await saveGeneratedContent(selectedNews.id, platform, result);
        return result;
      }
      return null;
    } catch (error) {
      console.error('Failed to regenerate content:', error);
      return null;
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleDeleteNews = (newsItem: NewsItem) => {
    deleteNewsItem(newsItem.id);
    if (selectedNewsId === newsItem.id) {
      setSelectedNewsId(null);
      setGeneratedContents({});
    }
  };

  const handleBookmarkNews = (newsItem: NewsItem) => {
    toggleBookmark(newsItem.id);
  };

  const handleCloseNewsDetail = () => {
    setSelectedNewsId(null);
    setGeneratedContents({});
  };

  const handleFetchSource = useCallback(async (source: Source, skipMarkAsRead = false): Promise<FetchResult> => {
    try {
      // fetch 전에 lastReadAt 업데이트 (새 뉴스와 기존 뉴스 사이에 마커 표시)
      if (!skipMarkAsRead) {
        await markAllAsRead();
      }
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
  }, [fetchFromRss, markAllAsRead]);

  const handleFetchAll = useCallback(async (): Promise<FetchResult[]> => {
    // Include sources with rssUrl OR supported types (youtube, threads)
    const fetchableSources = activeSources.filter((s) =>
      s.rssUrl || s.type === 'youtube' || s.type === 'threads'
    );

    // fetch 전에 한 번만 markAllAsRead 호출 (새 뉴스와 기존 뉴스 사이에 마커 표시)
    await markAllAsRead();

    const results: FetchResult[] = [];
    for (const source of fetchableSources) {
      // skipMarkAsRead = true로 전달하여 개별 호출 시 중복 호출 방지
      const result = await handleFetchSource(source, true);
      results.push(result);
    }

    return results;
  }, [activeSources, handleFetchSource, markAllAsRead]);

  const handleRefreshSources = useCallback(async () => {
    setIsRefreshingSources(true);
    try {
      await handleFetchAll();
    } finally {
      setIsRefreshingSources(false);
    }
  }, [handleFetchAll]);

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
        priority: defaultSource.priority || 'medium',
        mediaUrls: [],
      });
    }
  }, [activeSources, addNewsItem]);

  if (sourcesLoading || newsLoading) {
    return (
      <MainLayout sources={sources}>
        <DashboardSkeleton />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      sources={sources}
      onRefreshSources={handleRefreshSources}
      isRefreshing={isRefreshingSources}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total News</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.summarized}</div>
              <div className="text-sm text-muted-foreground">Summarized</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-500">{stats.bookmarked}</div>
              <div className="text-sm text-muted-foreground">Bookmarked</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.activeSources}</div>
              <div className="text-sm text-muted-foreground">Active Sources</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 sm:gap-2 border-b border-border pb-2">
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
            onDelete={handleDeleteNews}
            onBookmark={handleBookmarkNews}
            summarizingIds={summarizingIds}
            lastReadAt={lastReadAt}
            onMarkAllAsRead={markAllAsRead}
          />
        ) : (
          <ContentFetcher
            sources={activeSources}
            onFetchAll={handleFetchAll}
            onFetchSource={handleFetchSource}
            onScrape={handleScrape}
            onSave={handleSaveScrapedContent}
          />
        )}

        {/* News Detail Modal */}
        <NewsDetail
          isOpen={selectedNews !== null}
          news={selectedNews}
          source={selectedNews ? sources.find((s) => s.id === selectedNews.sourceId) : undefined}
          onClose={handleCloseNewsDetail}
          onGenerateContent={handleGenerateContent}
          onRegenerateWithFeedback={handleRegenerateWithFeedback}
          onBookmark={handleBookmarkNews}
          isGenerating={isGeneratingContent}
          generatedContents={generatedContents}
        />
      </div>
    </MainLayout>
  );
}
