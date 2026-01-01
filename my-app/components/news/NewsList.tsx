'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Newspaper,
  Bookmark,
} from 'lucide-react';
import { NewsCard } from './NewsCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { NewsItem, Source } from '@/types/news';

// Staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
} as const;

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'summarized' | 'pending' | 'bookmarked';

interface NewsListProps {
  news: NewsItem[];
  sources: Source[];
  isLoading?: boolean;
  onView?: (news: NewsItem) => void;
  onDelete?: (news: NewsItem) => void;
  onBookmark?: (news: NewsItem) => void;
  summarizingIds?: string[];
}

export function NewsList({
  news,
  sources,
  isLoading = false,
  onView,
  onDelete,
  onBookmark,
  summarizingIds = [],
}: NewsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSourceId, setFilterSourceId] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 99;

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
    const filtered = news.filter((item) => {
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
      if (filterStatus === 'bookmarked' && !item.isBookmarked) return false;

      // Source filter
      if (filterSourceId !== 'all' && item.sourceId !== filterSourceId) return false;

      return true;
    });

    // Sort by latest first (publishedAt or createdAt)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt).getTime();
      const dateB = new Date(b.publishedAt || b.createdAt).getTime();
      return dateB - dateA; // Descending (latest first)
    });
  }, [news, searchQuery, filterStatus, filterSourceId]);

  const stats = useMemo(() => {
    const summarized = news.filter((n) => n.quickSummary && n.quickSummary.bullets.length > 0).length;
    const bookmarked = news.filter((n) => n.isBookmarked).length;
    return {
      total: news.length,
      summarized,
      pending: news.length - summarized,
      bookmarked,
    };
  }, [news]);

  // Pagination
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const paginatedNews = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNews.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNews, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterSourceId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        <div className="flex flex-wrap gap-3 p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Status
            </label>
            <div className="flex items-center gap-1 flex-wrap">
              {(['all', 'summarized', 'pending', 'bookmarked'] as FilterStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors flex items-center gap-1.5 ${
                      filterStatus === status
                        ? status === 'bookmarked'
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {status === 'bookmarked' && <Bookmark className="w-3.5 h-3.5" />}
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
      <div className="flex items-center justify-between gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-zinc-600 dark:text-zinc-400">
            Showing{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {filteredNews.length}
            </span>{' '}
            of {stats.total} news
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="success" size="sm">
              {stats.summarized} summarized
            </Badge>
            <Badge variant="warning" size="sm">
              {stats.pending} pending
            </Badge>
            {stats.bookmarked > 0 && (
              <Badge variant="default" size="sm" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Bookmark className="w-3 h-3 mr-1 fill-current" />
                {stats.bookmarked} bookmarked
              </Badge>
            )}
          </div>
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
        <>
          <motion.div
            key={`${currentPage}-${filterStatus}-${filterSourceId}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                : 'flex flex-col gap-3'
            }
          >
            <AnimatePresence mode="popLayout">
              {paginatedNews.map((item) => (
                <motion.div
                  key={item.id}
                  variants={cardVariants}
                  layout
                >
                  <NewsCard
                    news={item}
                    source={sourceMap[item.sourceId]}
                    onView={onView}
                    onDelete={onDelete}
                    onBookmark={onBookmark}
                    isSummarizing={summarizingIds.includes(item.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-8 border-t border-zinc-200 dark:border-zinc-800">
              {/* Page Info */}
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredNews.length)} of {filteredNews.length} items
              </div>

              {/* Page Controls */}
              <div className="flex items-center gap-1">
                {/* First Page */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  aria-label="First page"
                  className="hidden sm:flex"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>

                {/* Previous */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages: (number | string)[] = [];
                    const showPages = 5; // Max visible page numbers
                    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
                    const end = Math.min(totalPages, start + showPages - 1);

                    if (end - start + 1 < showPages) {
                      start = Math.max(1, end - showPages + 1);
                    }

                    if (start > 1) {
                      pages.push(1);
                      if (start > 2) pages.push('...');
                    }

                    for (let i = start; i <= end; i++) {
                      pages.push(i);
                    }

                    if (end < totalPages) {
                      if (end < totalPages - 1) pages.push('...');
                      pages.push(totalPages);
                    }

                    return pages.map((page, idx) => (
                      typeof page === 'number' ? (
                        <Button
                          key={page}
                          variant={page === currentPage ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={`min-w-[36px] ${page === currentPage ? '' : 'text-zinc-600 dark:text-zinc-400'}`}
                        >
                          {page}
                        </Button>
                      ) : (
                        <span key={`ellipsis-${idx}`} className="px-2 text-zinc-400">
                          {page}
                        </span>
                      )
                    ));
                  })()}
                </div>

                {/* Next */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Last Page */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  aria-label="Last page"
                  className="hidden sm:flex"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default NewsList;
