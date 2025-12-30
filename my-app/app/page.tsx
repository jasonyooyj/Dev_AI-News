'use client';

import { useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { NewsList } from '@/components/news/NewsList';
import { NewsDetail } from '@/components/news/NewsDetail';
import { RssFetcher } from '@/components/collect/RssFetcher';
import { UrlScraper } from '@/components/collect/UrlScraper';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useSources } from '@/hooks/useSources';
import { useNews } from '@/hooks/useNews';
import { useOpenAI } from '@/hooks/useOpenAI';
import { useStyleTemplates } from '@/hooks/useStyleTemplates';
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

export default function DashboardPage() {
  const { sources, isLoading: sourcesLoading } = useSources();
  const { newsItems, isLoading: newsLoading, fetchFromRss, scrapeUrl, deleteNewsItem, toggleBookmark, refreshNews, addNewsItem } = useNews();
  const { isProcessing, generatePlatformContent, regenerateWithFeedback, addSummaryToNewsItem } = useOpenAI();
  const { templates: styleTemplates } = useStyleTemplates();

  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [activeTab, setActiveTab] = useState<'news' | 'collect'>('news');
  const [summarizingIds, setSummarizingIds] = useState<string[]>([]);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedContents, setGeneratedContents] = useState<Partial<Record<Platform, PlatformContent>>>({});
  const [isRefreshingSources, setIsRefreshingSources] = useState(false);

  const activeSources = sources.filter((s) => s.isActive);

  const handleViewNews = (newsItem: NewsItem) => {
    setSelectedNews(newsItem);
    setGeneratedContents({});
  };

  const handleGenerateContent = async (
    platform: Platform,
    styleTemplateId?: string
  ): Promise<PlatformContent | null> => {
    if (!selectedNews) return null;

    setIsGeneratingContent(true);
    try {
      // Find the style template by ID
      const styleTemplate = styleTemplateId
        ? styleTemplates.find((t) => t.id === styleTemplateId)
        : undefined;

      const result = await generatePlatformContent(selectedNews, platform, styleTemplate);
      if (result) {
        setGeneratedContents((prev) => ({
          ...prev,
          [platform]: result,
        }));
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
        setGeneratedContents((prev) => ({
          ...prev,
          [platform]: result,
        }));
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

  const handleSummarizeNews = async (newsItem: NewsItem) => {
    setSummarizingIds((prev) => [...prev, newsItem.id]);
    try {
      const result = await addSummaryToNewsItem(newsItem);
      if (result) {
        refreshNews();
      }
    } finally {
      setSummarizingIds((prev) => prev.filter((id) => id !== newsItem.id));
    }
  };

  // Handler for processing news content for platform publishing (kept for NewsDetail modal)
  const handleProcessForPlatforms = async (newsItem: NewsItem) => {
    // Platform content generation is handled within the NewsDetail component
    // This is a placeholder for future implementation
    refreshNews();
  };

  const handleDeleteNews = (newsItem: NewsItem) => {
    deleteNewsItem(newsItem.id);
    if (selectedNews?.id === newsItem.id) {
      setSelectedNews(null);
      setGeneratedContents({});
    }
  };

  const handleBookmarkNews = (newsItem: NewsItem) => {
    toggleBookmark(newsItem.id);
  };

  const handleCloseNewsDetail = () => {
    setSelectedNews(null);
    setGeneratedContents({});
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

  // Handler for sidebar "Fetch All Sources" button
  const handleRefreshSources = useCallback(async () => {
    setIsRefreshingSources(true);
    try {
      await handleFetchAll();
    } finally {
      setIsRefreshingSources(false);
    }
  }, [handleFetchAll]);

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
      <ProtectedRoute>
        <MainLayout sources={sources}>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
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
              <div className="text-2xl font-bold">{newsItems.length}</div>
              <div className="text-sm text-muted-foreground">Total News</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {newsItems.filter((n) => n.quickSummary && n.quickSummary.bullets.length > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Summarized</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-600">
                {newsItems.filter((n) => !n.quickSummary || n.quickSummary.bullets.length === 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-500">
                {newsItems.filter((n) => n.isBookmarked).length}
              </div>
              <div className="text-sm text-muted-foreground">Bookmarked</div>
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
          source={selectedNews ? sources.find((s) => s.id === selectedNews.sourceId) : undefined}
          onClose={handleCloseNewsDetail}
          onGenerateContent={handleGenerateContent}
          onRegenerateWithFeedback={handleRegenerateWithFeedback}
          onBookmark={handleBookmarkNews}
          styleTemplates={styleTemplates}
          isGenerating={isGeneratingContent}
          generatedContents={generatedContents}
        />
      </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
