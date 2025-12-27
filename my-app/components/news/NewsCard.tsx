'use client';

import { memo } from 'react';
import {
  ExternalLink,
  Trash2,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { NewsItem, Source } from '@/types/news';

interface NewsCardProps {
  news: NewsItem;
  source?: Source;
  onProcess?: (news: NewsItem) => void;
  onView?: (news: NewsItem) => void;
  onDelete?: (news: NewsItem) => void;
  isProcessing?: boolean;
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export const NewsCard = memo(function NewsCard({
  news,
  source,
  onProcess,
  onView,
  onDelete,
  isProcessing = false,
}: NewsCardProps) {
  return (
    <Card
      variant="default"
      padding="none"
      className="group hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 overflow-hidden"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {source && (
              <Badge variant="info" size="sm">
                {source.name}
              </Badge>
            )}
            <Badge
              variant={news.isProcessed ? 'success' : 'default'}
              size="sm"
              dot
            >
              {news.isProcessed ? 'Processed' : 'Pending'}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <Clock className="w-3 h-3" />
            <span>{formatDate(news.publishedAt || news.createdAt)}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {news.title}
        </h3>

        {/* Content Preview */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-4">
          {news.originalContent}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant={news.isProcessed ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => onProcess?.(news)}
            isLoading={isProcessing}
            disabled={isProcessing}
            leftIcon={
              news.isProcessed ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )
            }
            className="flex-1"
          >
            {news.isProcessed ? 'View Processed' : 'Process with AI'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView?.(news)}
            aria-label="View original"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(news)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="Delete news"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
});

export default NewsCard;
