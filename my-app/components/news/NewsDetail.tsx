'use client';

import { useState } from 'react';
import {
  ExternalLink,
  Clock,
  Sparkles,
  FileText,
  Share2,
} from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { PlatformPreview } from '@/components/social/PlatformPreview';
import { NewsItem, ProcessedNews, Source, Platform, PLATFORM_CONFIGS } from '@/types/news';

interface NewsDetailProps {
  isOpen: boolean;
  onClose: () => void;
  news: NewsItem | null;
  source?: Source;
  processedNews?: ProcessedNews | null;
  onProcess?: (news: NewsItem) => Promise<void>;
  isProcessing?: boolean;
}

type TabType = 'original' | 'processed';

function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown date';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NewsDetail({
  isOpen,
  onClose,
  news,
  source,
  processedNews,
  onProcess,
  isProcessing = false,
}: NewsDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('original');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('twitter');

  if (!news) return null;

  const platforms = Object.keys(PLATFORM_CONFIGS) as Platform[];

  const handleProcess = async () => {
    if (news && onProcess) {
      await onProcess(news);
      setActiveTab('processed');
    }
  };

  const handleViewOriginal = () => {
    window.open(news.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={news.title}
      size="xl"
    >
      <div className="space-y-6">
        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3">
          {source && (
            <Badge variant="info" size="md">
              {source.name}
            </Badge>
          )}
          <Badge
            variant={news.isProcessed ? 'success' : 'warning'}
            size="md"
            dot
          >
            {news.isProcessed ? 'Processed' : 'Pending'}
          </Badge>
          <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <Clock className="w-4 h-4" />
            <span>{formatDate(news.publishedAt || news.createdAt)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('original')}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                ${
                  activeTab === 'original'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }
              `}
            >
              <FileText className="w-4 h-4" />
              Original Content
            </button>
            <button
              onClick={() => setActiveTab('processed')}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                ${
                  activeTab === 'processed'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }
              `}
            >
              <Share2 className="w-4 h-4" />
              Platform Previews
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'original' ? (
          <div className="space-y-4">
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {news.originalContent}
              </p>
            </div>

            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              View original article
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Spinner size="lg" />
                <div className="text-center">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    Processing with AI...
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Generating content for all platforms
                  </p>
                </div>
              </div>
            ) : processedNews ? (
              <>
                {/* Summary */}
                {processedNews.summary && (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      AI Summary
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {processedNews.summary}
                    </p>
                  </div>
                )}

                {/* Platform Selector */}
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => {
                    const config = PLATFORM_CONFIGS[platform];
                    const hasContent = !!processedNews.platforms[platform];
                    return (
                      <button
                        key={platform}
                        onClick={() => setSelectedPlatform(platform)}
                        disabled={!hasContent}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                          ${
                            selectedPlatform === platform
                              ? 'bg-blue-600 text-white shadow-md'
                              : hasContent
                              ? 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500'
                              : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                          }
                        `}
                      >
                        {config.name}
                        {hasContent && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Platform Preview */}
                <PlatformPreview
                  platform={selectedPlatform}
                  content={processedNews.platforms[selectedPlatform]}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <Sparkles className="w-8 h-8 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    Not processed yet
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    Process this news with AI to generate platform-specific content
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleProcess}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Process with AI
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="secondary"
          onClick={handleViewOriginal}
          leftIcon={<ExternalLink className="w-4 h-4" />}
        >
          View Original
        </Button>
        {!news.isProcessed && !isProcessing && (
          <Button
            variant="primary"
            onClick={handleProcess}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Process with AI
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

export default NewsDetail;
