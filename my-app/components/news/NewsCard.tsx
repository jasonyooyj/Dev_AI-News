'use client';

import { memo } from 'react';
import {
  ExternalLink,
  Trash2,
  Clock,
  Eye,
  Bookmark,
  Youtube,
  Rss,
  Globe,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { NewsItem, Source, NewsCategory, NEWS_CATEGORY_LABELS, PRIORITY_LABELS, Priority, SourceType } from '@/types/news';
import { formatCompactDate } from '@/lib/date';

interface NewsCardProps {
  news: NewsItem;
  source?: Source;
  onView?: (news: NewsItem) => void;
  onDelete?: (news: NewsItem) => void;
  onBookmark?: (news: NewsItem) => void;
  isSummarizing?: boolean;
}

// Platform-specific styles
const platformStyles: Record<SourceType, { border: string; shadow: string; iconColor: string; bg: string }> = {
  youtube: {
    border: 'border-l-4 border-l-red-500',
    shadow: 'hover:shadow-red-500/10',
    iconColor: 'text-red-500',
    bg: 'bg-red-500',
  },
  threads: {
    border: 'border-l-4 border-l-zinc-800 dark:border-l-zinc-300',
    shadow: 'hover:shadow-zinc-500/10',
    iconColor: 'text-zinc-800 dark:text-zinc-200',
    bg: 'bg-zinc-800 dark:bg-zinc-300',
  },
  twitter: {
    border: 'border-l-4 border-l-zinc-900 dark:border-l-zinc-100',
    shadow: 'hover:shadow-zinc-500/10',
    iconColor: 'text-zinc-900 dark:text-zinc-100',
    bg: 'bg-zinc-900 dark:bg-zinc-100',
  },
  rss: {
    border: 'border-l-4 border-l-orange-500',
    shadow: 'hover:shadow-orange-500/10',
    iconColor: 'text-orange-500',
    bg: 'bg-orange-500',
  },
  blog: {
    border: 'border-l-4 border-l-blue-500',
    shadow: 'hover:shadow-blue-500/10',
    iconColor: 'text-blue-500',
    bg: 'bg-blue-500',
  },
};

// Platform icon component
function PlatformIcon({ type, className }: { type: SourceType; className?: string }) {
  const iconClass = `w-3.5 h-3.5 ${className || ''}`;

  switch (type) {
    case 'youtube':
      return <Youtube className={iconClass} />;
    case 'threads':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068V11.5h3.25v.568c0 2.776.646 5.058 1.869 6.59 1.142 1.432 2.925 2.213 5.157 2.255H12.186V24z"/>
          <path d="M17.243 21.063c-1.062.438-2.226.688-3.457.75v-3.126c.644-.044 1.256-.175 1.82-.389.689-.261 1.299-.639 1.814-1.122.526-.493.937-1.094 1.223-1.789.296-.718.446-1.52.446-2.387 0-.866-.15-1.668-.446-2.386-.286-.695-.697-1.297-1.223-1.79-.515-.483-1.125-.86-1.814-1.121-.564-.214-1.176-.345-1.82-.39V4h.007c1.231.062 2.395.312 3.457.75 1.178.487 2.213 1.178 3.077 2.052.863.874 1.545 1.918 2.027 3.104.475 1.166.716 2.41.716 3.726 0 1.316-.241 2.56-.716 3.726-.482 1.186-1.164 2.23-2.027 3.104-.864.874-1.899 1.565-3.077 2.052z"/>
          <path d="M13.786 0h-.007c-1.231.062-2.395.312-3.457.75-1.178.487-2.213 1.178-3.077 2.052-.863.874-1.545 1.918-2.027 3.104-.475 1.166-.716 2.41-.716 3.726h3.25c0-.866.15-1.668.446-2.386.286-.695.697-1.297 1.223-1.79.515-.483 1.125-.86 1.814-1.121.564-.214 1.176-.345 1.82-.39h.409l.315.044V.937L13.786 0z"/>
        </svg>
      );
    case 'twitter':
      return <span className={`${iconClass} font-bold flex items-center justify-center`}>𝕏</span>;
    case 'rss':
      return <Rss className={iconClass} />;
    default:
      return <Globe className={iconClass} />;
  }
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

  // Get platform style based on source type
  const sourceType = source?.type || 'blog';
  const platformStyle = platformStyles[sourceType];

  return (
    <Card
      variant="default"
      padding="none"
      className={`group hover:shadow-lg ${platformStyle.shadow} hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 overflow-hidden relative flex flex-col h-full ${platformStyle.border}`}
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
              <Badge variant="default" size="sm" className="flex items-center gap-1.5">
                <PlatformIcon type={sourceType} className={platformStyle.iconColor} />
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
          className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3 leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
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
