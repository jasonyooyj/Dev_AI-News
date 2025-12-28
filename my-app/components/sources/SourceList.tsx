'use client';

import { useState } from 'react';
import {
  Rss,
  Link2,
  MoreVertical,
  Edit2,
  Trash2,
  Power,
  ExternalLink,
  Clock,
  Plus,
  Database,
  Globe,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Source } from '@/types/news';

interface SourceListProps {
  sources: Source[];
  isLoading?: boolean;
  onEdit?: (source: Source) => void;
  onDelete?: (source: Source) => void;
  onToggle?: (source: Source) => void;
  onAdd?: () => void;
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface SourceCardProps {
  source: Source;
  onEdit?: (source: Source) => void;
  onDelete?: (source: Source) => void;
  onToggle?: (source: Source) => void;
}

// Get favicon URL from website URL
function getFaviconUrl(websiteUrl: string): string {
  try {
    const url = new URL(websiteUrl);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch {
    return '';
  }
}

function SourceCard({ source, onEdit, onDelete, onToggle }: SourceCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const logoSrc = source.logoUrl || getFaviconUrl(source.websiteUrl);

  return (
    <Card
      variant="default"
      padding="none"
      className={`
        group transition-all duration-200
        ${
          source.isActive
            ? 'hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700'
            : 'opacity-60'
        }
      `}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              {logoSrc && !imgError ? (
                <img
                  src={logoSrc}
                  alt={`${source.name} logo`}
                  className="w-6 h-6 object-contain"
                  onError={() => setImgError(true)}
                />
              ) : source.rssUrl ? (
                <Rss className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              ) : (
                <Link2 className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {source.name}
              </h3>
              <Badge
                variant={source.isActive ? 'success' : 'default'}
                size="sm"
                dot
              >
                {source.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 py-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700">
                  <button
                    onClick={() => {
                      onEdit?.(source);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onToggle?.(source);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    <Power className="w-4 h-4" />
                    {source.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <hr className="my-1 border-zinc-200 dark:border-zinc-700" />
                  <button
                    onClick={() => {
                      onDelete?.(source);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* URLs */}
        {/* Description */}
        {source.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
            {source.description}
          </p>
        )}

        <div className="space-y-2 mb-4">
          <a
            href={source.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{source.websiteUrl}</span>
          </a>
          {source.rssUrl ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500">
              <Rss className="w-3.5 h-3.5 flex-shrink-0 text-orange-500" />
              <span className="truncate">RSS Feed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500">
              <Globe className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
              <span className="truncate">Web Scraping</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Last fetched: {formatDate(source.lastFetchedAt)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(source)}
              aria-label="Edit source"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <button
              onClick={() => onToggle?.(source)}
              className={`
                relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                dark:focus:ring-offset-zinc-900
                ${source.isActive ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600'}
              `}
              aria-label={source.isActive ? 'Disable source' : 'Enable source'}
            >
              <span
                className={`
                  inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform
                  ${source.isActive ? 'translate-x-5' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SourceList({
  sources,
  isLoading = false,
  onEdit,
  onDelete,
  onToggle,
  onAdd,
}: SourceListProps) {
  const activeCount = sources.filter((s) => s.isActive).length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading sources...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              News Sources
            </h2>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {sources.length} sources ({activeCount} active)
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your AI news sources. Add RSS feeds or websites to collect news from.
          </p>
        </div>
        <Button onClick={() => onAdd?.()} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Source
        </Button>
      </div>

      {/* Sources Grid */}
      {sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Database className="w-8 h-8 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              No sources yet
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Add your first news source to start collecting AI news
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SourceList;
