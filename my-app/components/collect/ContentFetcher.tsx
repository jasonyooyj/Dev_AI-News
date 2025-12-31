'use client';

import { useState, FormEvent, useEffect } from 'react';
import {
  Rss,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Youtube,
  Link2,
  ArrowRight,
  Globe,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Input, Textarea } from '@/components/ui/Input';
import { Source, SourceType, SOURCE_TYPE_LABELS } from '@/types/news';

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
  author?: string;
  thumbnailUrl?: string;
  error?: string;
}

interface ContentFetcherProps {
  sources: Source[];
  onFetchAll?: () => Promise<FetchResult[]>;
  onFetchSource?: (source: Source) => Promise<FetchResult>;
  onScrape?: (url: string, type?: SourceType) => Promise<ScrapeResult>;
  onSave?: (data: { url: string; title: string; content: string; type?: SourceType }) => void;
}

type TabType = 'sources' | 'manual';

// URL에서 소스 타입 자동 감지
function detectSourceType(url: string): SourceType {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/twitter\.com|x\.com/i.test(url)) return 'twitter';
  if (/threads\.net/i.test(url)) return 'threads';
  return 'blog';
}

export function ContentFetcher({
  sources,
  onFetchAll,
  onFetchSource,
  onScrape,
  onSave,
}: ContentFetcherProps) {
  const [activeTab, setActiveTab] = useState<TabType>('sources');

  // Source Fetcher state
  const [isFetching, setIsFetching] = useState(false);
  const [fetchingSourceId, setFetchingSourceId] = useState<string | null>(null);
  const [results, setResults] = useState<FetchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // URL Scraper state
  const [url, setUrl] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('blog');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [urlError, setUrlError] = useState('');

  // Include sources with rssUrl OR supported types (youtube, threads)
  const fetchableSources = sources.filter((s) =>
    s.isActive && (s.rssUrl || s.type === 'youtube' || s.type === 'threads')
  );

  // URL 변경시 소스 타입 자동 감지
  useEffect(() => {
    if (url) {
      const detected = detectSourceType(url);
      setSourceType(detected);
    }
  }, [url]);

  // Source Fetcher handlers
  const handleFetchAll = async () => {
    if (!onFetchAll) return;

    setIsFetching(true);
    setShowResults(true);
    setResults([]);

    try {
      const fetchResults = await onFetchAll();
      setResults(fetchResults);
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleFetchSource = async (source: Source) => {
    if (!onFetchSource) return;

    setFetchingSourceId(source.id);

    try {
      const result = await onFetchSource(source);
      setResults((prev) => {
        const existing = prev.findIndex((r) => r.sourceId === source.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = result;
          return updated;
        }
        return [...prev, result];
      });
      setShowResults(true);
    } catch (error) {
      console.error('Failed to fetch source:', error);
    } finally {
      setFetchingSourceId(null);
    }
  };

  // URL Scraper handlers
  const validateUrl = (input: string): boolean => {
    if (!input) {
      setUrlError('URL is required');
      return false;
    }
    try {
      new URL(input);
      setUrlError('');
      return true;
    } catch {
      setUrlError('Please enter a valid URL');
      return false;
    }
  };

  const handleScrape = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateUrl(url)) return;

    setIsScraping(true);
    setScrapeResult(null);
    setTitle('');
    setContent('');
    setAuthor('');

    try {
      let result: ScrapeResult;

      if (sourceType === 'youtube' || sourceType === 'twitter' || sourceType === 'threads') {
        const response = await fetch('/api/scrape-social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, type: sourceType }),
        });
        const data = await response.json();

        if (!response.ok) {
          result = { success: false, error: data.error };
        } else {
          result = {
            success: true,
            title: data.title,
            content: data.content,
            author: data.author,
            thumbnailUrl: data.thumbnailUrl,
          };
        }
      } else if (onScrape) {
        result = await onScrape(url, sourceType);
      } else {
        result = { success: false, error: 'No scrape handler available' };
      }

      setScrapeResult(result);

      if (result.success) {
        setTitle(result.title || '');
        setContent(result.content || '');
        setAuthor(result.author || '');
      }
    } catch (error) {
      setScrapeResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape URL',
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || !onSave) return;

    setIsSaving(true);

    try {
      await onSave({
        url,
        title: title.trim(),
        content: content.trim(),
        type: sourceType,
      });

      // Reset form on success
      setUrl('');
      setTitle('');
      setContent('');
      setAuthor('');
      setScrapeResult(null);
      setSourceType('blog');
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setTitle('');
    setContent('');
    setAuthor('');
    setScrapeResult(null);
    setUrlError('');
    setSourceType('blog');
  };

  // Helper functions
  const getSourceIcon = (source: Source) => {
    if (source.type === 'youtube') return <Youtube className="w-4 h-4 text-red-500" />;
    if (source.type === 'threads') return (
      <svg className="w-4 h-4 text-zinc-900 dark:text-zinc-100" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068V11.5h3.25v.568c0 2.776.646 5.058 1.869 6.59 1.142 1.432 2.925 2.213 5.157 2.255H12.186V24z"/>
        <path d="M17.243 21.063c-1.062.438-2.226.688-3.457.75v-3.126c.644-.044 1.256-.175 1.82-.389.689-.261 1.299-.639 1.814-1.122.526-.493.937-1.094 1.223-1.789.296-.718.446-1.52.446-2.387 0-.866-.15-1.668-.446-2.386-.286-.695-.697-1.297-1.223-1.79-.515-.483-1.125-.86-1.814-1.121-.564-.214-1.176-.345-1.82-.39V4h.007c1.231.062 2.395.312 3.457.75 1.178.487 2.213 1.178 3.077 2.052.863.874 1.545 1.918 2.027 3.104.475 1.166.716 2.41.716 3.726 0 1.316-.241 2.56-.716 3.726-.482 1.186-1.164 2.23-2.027 3.104-.864.874-1.899 1.565-3.077 2.052-.011.004-.022.009-.033.013z"/>
        <path d="M13.786 0h-.007c-1.231.062-2.395.312-3.457.75-1.178.487-2.213 1.178-3.077 2.052-.863.874-1.545 1.918-2.027 3.104-.475 1.166-.716 2.41-.716 3.726h3.25c0-.866.15-1.668.446-2.386.286-.695.697-1.297 1.223-1.79.515-.483 1.125-.86 1.814-1.121.564-.214 1.176-.345 1.82-.39h.409l.315.044V.937L13.786 0z"/>
      </svg>
    );
    return <Rss className="w-4 h-4 text-orange-500" />;
  };

  const getSourceTypeIcon = (type: SourceType) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
      case 'twitter': return <span className="w-4 h-4 font-bold text-xs flex items-center justify-center">𝕏</span>;
      case 'threads': return <span className="w-4 h-4 font-bold text-xs flex items-center justify-center">@</span>;
      case 'rss': return <Rss className="w-4 h-4 text-orange-500" />;
      default: return <Globe className="w-4 h-4 text-blue-500" />;
    }
  };

  const successCount = results.filter((r) => r.success).length;
  const totalItems = results.reduce((acc, r) => acc + (r.itemsFetched || 0), 0);
  const hasScrapedContent = scrapeResult?.success && (title || content);

  return (
    <Card variant="default" padding="none">
      <CardHeader className="p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-blue-100 dark:from-orange-900/30 dark:to-blue-900/30 text-orange-600 dark:text-orange-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Content Fetcher</CardTitle>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Fetch from sources or add manually
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('sources')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'sources'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Rss className="w-4 h-4" />
            Sources ({fetchableSources.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'manual'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Link2 className="w-4 h-4" />
            Add URL
          </span>
        </button>
      </div>

      <CardContent className="p-3 sm:p-4">
        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <div className="space-y-4">
            {/* Fetch All Button */}
            <Button
              variant="primary"
              onClick={handleFetchAll}
              isLoading={isFetching}
              disabled={fetchableSources.length === 0 || isFetching}
              leftIcon={!isFetching && <RefreshCw className="w-4 h-4" />}
              className="w-full"
            >
              Fetch All Sources
            </Button>

            {fetchableSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <Database className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    No fetchable sources
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Add RSS, YouTube, or Threads sources
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {fetchableSources.map((source) => {
                  const result = results.find((r) => r.sourceId === source.id);
                  const isCurrentlyFetching = fetchingSourceId === source.id;
                  const displayUrl = source.rssUrl || source.websiteUrl;

                  return (
                    <div
                      key={source.id}
                      className="flex items-center justify-between gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {getSourceIcon(source)}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {source.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {displayUrl}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {result && (
                          <Badge
                            variant={result.success ? 'success' : 'danger'}
                            size="sm"
                          >
                            {result.success ? `${result.itemsFetched}` : 'Failed'}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFetchSource(source)}
                          disabled={isCurrentlyFetching || isFetching}
                          aria-label={`Fetch ${source.name}`}
                        >
                          {isCurrentlyFetching ? (
                            <Spinner size="sm" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Results Summary */}
            {showResults && results.length > 0 && (
              <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Results
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setResults([]);
                      setShowResults(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    {successCount} success
                  </span>
                  {results.length - successCount > 0 && (
                    <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      {results.length - successCount} failed
                    </span>
                  )}
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {totalItems} items fetched
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual URL Tab */}
        {activeTab === 'manual' && (
          <form onSubmit={handleScrape} className="space-y-4">
            {/* 소스 타입 선택 */}
            <div className="flex flex-wrap gap-2">
              {(['blog', 'youtube', 'twitter', 'threads'] as SourceType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSourceType(type)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${sourceType === type
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-2 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }
                  `}
                >
                  {getSourceTypeIcon(type)}
                  {SOURCE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {/* URL Input */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  placeholder={
                    sourceType === 'youtube' ? 'https://youtube.com/watch?v=...' :
                    sourceType === 'twitter' ? 'https://x.com/username/status/...' :
                    sourceType === 'threads' ? 'https://threads.net/@username/post/...' :
                    'https://example.com/article'
                  }
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (urlError) validateUrl(e.target.value);
                  }}
                  error={urlError}
                  leftIcon={getSourceTypeIcon(sourceType)}
                  disabled={isScraping}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={!url || isScraping}
                isLoading={isScraping}
                leftIcon={!isScraping && <ArrowRight className="w-4 h-4" />}
              >
                Scrape
              </Button>
            </div>

            {/* Status Message */}
            {scrapeResult && !scrapeResult.success && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Failed to scrape URL
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400/80">
                    {scrapeResult.error || 'An unknown error occurred'}
                  </p>
                </div>
              </div>
            )}

            {scrapeResult?.success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Successfully scraped content
                </p>
              </div>
            )}

            {/* Scraped Content */}
            {hasScrapedContent && (
              <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Article title"
                />

                {author && (
                  <Input
                    label="Author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Author name"
                  />
                )}

                <Textarea
                  label="Content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Article content..."
                  className="min-h-[120px]"
                />

                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" type="button" onClick={handleReset}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="button"
                    onClick={handleSave}
                    disabled={!title.trim() || !content.trim() || isSaving}
                    isLoading={isSaving}
                  >
                    Save News
                  </Button>
                </div>
              </div>
            )}

            {/* Manual Entry Option */}
            {!hasScrapedContent && !isScraping && (
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setScrapeResult({ success: true });
                    setTitle('');
                    setContent('');
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Or enter content manually
                </button>
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default ContentFetcher;
