'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  Newspaper,
} from 'lucide-react';
import { NewsCard } from './NewsCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { NewsItem, Source } from '@/types/news';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'summarized' | 'pending';

interface NewsListProps {
  news: NewsItem[];
  sources: Source[];
  isLoading?: boolean;
  onView?: (news: NewsItem) => void;
  onDelete?: (news: NewsItem) => void;
  summarizingIds?: string[];
}

export function NewsList({
  news,
  sources,
  isLoading = false,
  onView,
  onDelete,
  summarizingIds = [],
}: NewsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSourceId, setFilterSourceId] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const sourceMap = useMemo(() => {
    return sources.reduce(
      (acc, source) => {
        acc[source.id] = source;
        return acc;
      },
      {} as Record<string, Source>
    );
  }, [sources]);

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesContent = item.originalContent.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent) return false;
      }

      // Status filter (based on quickSummary availability)
      const hasSummary = item.quickSummary && item.quickSummary.bullets.length > 0;
      if (filterStatus === 'summarized' && !hasSummary) return false;
      if (filterStatus === 'pending' && hasSummary) return false;

      // Source filter
      if (filterSourceId !== 'all' && item.sourceId !== filterSourceId) return false;

      return true;
    });
  }, [news, searchQuery, filterStatus, filterSourceId]);

  const stats = useMemo(() => {
    const summarized = news.filter((n) => n.quickSummary && n.quickSummary.bullets.length > 0).length;
    return {
      total: news.length,
      summarized,
      pending: news.length - summarized,
    };
  }, [news]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading news...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'secondary' : 'ghost'}
            size="md"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="w-4 h-4" />}
            rightIcon={
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`}
              />
            }
          >
            Filters
          </Button>

          <div className="hidden sm:flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${
                viewMode === 'grid'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
              aria-label="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${
                viewMode === 'list'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Status
            </label>
            <div className="flex items-center gap-1">
              {(['all', 'summarized', 'pending'] as FilterStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Source
            </label>
            <select
              value={filterSourceId}
              onChange={(e) => setFilterSourceId(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sources</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">
          Showing{' '}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {filteredNews.length}
          </span>{' '}
          of {stats.total} news
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm">
            {stats.summarized} summarized
          </Badge>
          <Badge variant="warning" size="sm">
            {stats.pending} pending
          </Badge>
        </div>
      </div>

      {/* News Grid/List */}
      {filteredNews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Newspaper className="w-8 h-8 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              No news found
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {searchQuery || filterStatus !== 'all' || filterSourceId !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Start by fetching news from your sources'}
            </p>
          </div>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
              : 'flex flex-col gap-3'
          }
        >
          {filteredNews.map((item) => (
            <NewsCard
              key={item.id}
              news={item}
              source={sourceMap[item.sourceId]}
              onView={onView}
              onDelete={onDelete}
              isSummarizing={summarizingIds.includes(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NewsList;
