'use client';

import { memo } from 'react';
import {
  ExternalLink,
  Trash2,
  Clock,
  Eye,
  Bookmark,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { NewsItem, Source, NewsCategory, NEWS_CATEGORY_LABELS, PRIORITY_LABELS, Priority } from '@/types/news';
import { formatCompactDate } from '@/lib/date';

interface NewsCardProps {
  news: NewsItem;
  source?: Source;
  onView?: (news: NewsItem) => void;
  onDelete?: (news: NewsItem) => void;
  onBookmark?: (news: NewsItem) => void;
  isSummarizing?: boolean;
}

const categoryVariants: Record<NewsCategory, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  product: 'info',
  update: 'success',
  research: 'warning',
  announcement: 'danger',
  other: 'default',
};

const priorityStyles: Record<Priority, { bg: string; text: string; dot: string }> = {
  high: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  low: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
};

function SummarySkeleton() {
  return (
    <div className="space-y-2.5" aria-label="Loading summary">
      <div className="flex items-start gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 mt-1.5 shrink-0 animate-pulse" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full animate-pulse" />
      </div>
      <div className="flex items-start gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 mt-1.5 shrink-0 animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-11/12 animate-pulse" style={{ animationDelay: '150ms' }} />
      </div>
      <div className="flex items-start gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 mt-1.5 shrink-0 animate-pulse" style={{ animationDelay: '300ms' }} />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-10/12 animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function SummaryLoading() {
  return (
    <div className="flex items-center gap-2 py-4">
      <Spinner size="sm" />
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        Generating summary...
      </span>
    </div>
  );
}

export const NewsCard = memo(function NewsCard({
  news,
  source,
  onView,
  onDelete,
  onBookmark,
  isSummarizing = false,
}: NewsCardProps) {
  const hasQuickSummary = news.quickSummary && news.quickSummary.bullets.length > 0;
  const isBookmarked = news.isBookmarked ?? false;
  const priority = news.priority || 'medium';
  const priorityStyle = priorityStyles[priority];

  return (
    <Card
      variant="default"
      padding="none"
      className="group hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 overflow-hidden relative flex flex-col"
    >
      {/* Priority Badge - 카드 좌상단 */}
      {priority !== 'medium' && (
        <div className={`absolute top-0 left-0 px-2 py-1 text-xs font-medium rounded-br-lg ${priorityStyle.bg} ${priorityStyle.text} flex items-center gap-1.5`}>
          <span className={`w-2 h-2 rounded-full ${priorityStyle.dot}`} />
          {PRIORITY_LABELS[priority]}
        </div>
      )}

      <div className={`p-4 sm:p-5 flex flex-col flex-1 ${priority !== 'medium' ? 'pt-8' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {source && (
              <Badge variant="default" size="sm">
                {source.name}
              </Badge>
            )}
            {hasQuickSummary && news.quickSummary && (
              <Badge
                variant={categoryVariants[news.quickSummary.category]}
                size="sm"
              >
                {NEWS_CATEGORY_LABELS[news.quickSummary.category]}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
            <Clock className="w-3 h-3" />
            <span>{formatCompactDate(news.publishedAt || news.createdAt)}</span>
          </div>
        </div>

        {/* Title - 클릭 시 상세 보기 */}
        <h3
          onClick={() => onView?.(news)}
          className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3 leading-relaxed hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          {news.title}
        </h3>

        {/* Summary Content */}
        <div className="mb-4">
          {isSummarizing ? (
            <SummaryLoading />
          ) : hasQuickSummary && news.quickSummary ? (
            <ul className="space-y-1.5">
              {news.quickSummary.bullets.map((bullet, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          ) : (
            <SummarySkeleton />
          )}
        </div>

        {/* Actions - 하단 고정 */}
        <div className="flex items-center gap-2 pt-3 mt-auto border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onView?.(news)}
            leftIcon={<Eye className="w-4 h-4" />}
            className="flex-1"
          >
            View Details
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBookmark?.(news)}
            className={isBookmarked
              ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              : "text-zinc-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            }
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            title={isBookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(news.url, '_blank', 'noopener,noreferrer')}
            aria-label="Open original article"
            title="Open original"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(news)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="Delete news"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
});

export default NewsCard;
