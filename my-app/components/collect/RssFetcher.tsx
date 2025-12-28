'use client';

import { useState } from 'react';
import { Rss, RefreshCw, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Source } from '@/types/news';

interface FetchResult {
  sourceId: string;
  sourceName: string;
  success: boolean;
  itemsFetched?: number;
  error?: string;
}

interface RssFetcherProps {
  sources: Source[];
  onFetchAll?: () => Promise<FetchResult[]>;
  onFetchSource?: (source: Source) => Promise<FetchResult>;
}

export function RssFetcher({
  sources,
  onFetchAll,
  onFetchSource,
}: RssFetcherProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchingSourceId, setFetchingSourceId] = useState<string | null>(null);
  const [results, setResults] = useState<FetchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const rssSources = sources.filter((s) => s.rssUrl && s.isActive);

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

  const successCount = results.filter((r) => r.success).length;
  const totalItems = results.reduce((acc, r) => acc + (r.itemsFetched || 0), 0);

  return (
    <Card variant="default" padding="none">
      <CardHeader className="p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
            <Rss className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>RSS Feed Fetcher</CardTitle>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {rssSources.length} active RSS sources
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={handleFetchAll}
          isLoading={isFetching}
          disabled={rssSources.length === 0 || isFetching}
          leftIcon={!isFetching && <RefreshCw className="w-4 h-4" />}
        >
          Fetch All
        </Button>
      </CardHeader>

      <CardContent className="p-3 sm:p-4">
        {rssSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Database className="w-6 h-6 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                No RSS sources configured
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Add RSS URLs to your sources to enable fetching
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Source List */}
            <div className="space-y-2">
              {rssSources.map((source) => {
                const result = results.find((r) => r.sourceId === source.id);
                const isCurrentlyFetching = fetchingSourceId === source.id;

                return (
                  <div
                    key={source.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <Rss className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {source.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[120px] sm:max-w-[200px]">
                          {source.rssUrl}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {result && (
                        <Badge
                          variant={result.success ? 'success' : 'danger'}
                          size="sm"
                        >
                          {result.success
                            ? `${result.itemsFetched} items`
                            : 'Failed'}
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

            {/* Results Summary */}
            {showResults && results.length > 0 && (
              <div className="mt-4 p-3 sm:p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Fetch Results
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

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {successCount} successful
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {results.length - successCount} failed
                    </span>
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    {totalItems} total items fetched
                  </div>
                </div>

                {results.some((r) => !r.success) && (
                  <div className="space-y-1">
                    {results
                      .filter((r) => !r.success)
                      .map((r) => (
                        <p
                          key={r.sourceId}
                          className="text-xs text-red-600 dark:text-red-400"
                        >
                          {r.sourceName}: {r.error || 'Unknown error'}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RssFetcher;
