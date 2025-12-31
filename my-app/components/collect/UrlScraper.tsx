'use client';

import { useState, FormEvent, useEffect } from 'react';
import {
  Link2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Rss,
  Youtube,
  Globe,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { SourceType, SOURCE_TYPE_LABELS } from '@/types/news';

interface ScrapeResult {
  success: boolean;
  title?: string;
  content?: string;
  author?: string;
  thumbnailUrl?: string;
  error?: string;
}

interface UrlScraperProps {
  onScrape?: (url: string, type?: SourceType) => Promise<ScrapeResult>;
  onSave?: (data: { url: string; title: string; content: string; type?: SourceType }) => void;
}

// URL에서 소스 타입 자동 감지
function detectSourceType(url: string): SourceType {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/twitter\.com|x\.com/i.test(url)) return 'twitter';
  if (/threads\.net/i.test(url)) return 'threads';
  return 'blog';
}

export function UrlScraper({ onScrape, onSave }: UrlScraperProps) {
  const [url, setUrl] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('blog');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [urlError, setUrlError] = useState('');

  // URL 변경시 소스 타입 자동 감지
  useEffect(() => {
    if (url) {
      const detected = detectSourceType(url);
      setSourceType(detected);
    }
  }, [url]);

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
    setResult(null);
    setTitle('');
    setContent('');
    setAuthor('');

    try {
      let scrapeResult: ScrapeResult;

      // 소스 타입에 따라 다른 API 호출
      if (sourceType === 'youtube' || sourceType === 'twitter' || sourceType === 'threads') {
        const response = await fetch('/api/scrape-social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, type: sourceType }),
        });
        const data = await response.json();

        if (!response.ok) {
          scrapeResult = { success: false, error: data.error };
        } else {
          scrapeResult = {
            success: true,
            title: data.title,
            content: data.content,
            author: data.author,
            thumbnailUrl: data.thumbnailUrl,
          };
        }
      } else if (onScrape) {
        // 기존 blog/rss 스크래핑
        scrapeResult = await onScrape(url, sourceType);
      } else {
        scrapeResult = { success: false, error: 'No scrape handler available' };
      }

      setResult(scrapeResult);

      if (scrapeResult.success) {
        setTitle(scrapeResult.title || '');
        setContent(scrapeResult.content || '');
        setAuthor(scrapeResult.author || '');
      }
    } catch (error) {
      setResult({
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
      setResult(null);
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
    setResult(null);
    setUrlError('');
    setSourceType('blog');
  };

  // 소스 타입별 아이콘
  const getSourceTypeIcon = (type: SourceType) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'twitter':
        return <span className="w-4 h-4 font-bold text-xs flex items-center justify-center">𝕏</span>;
      case 'threads':
        return <span className="w-4 h-4 font-bold text-xs flex items-center justify-center">@</span>;
      case 'rss':
        return <Rss className="w-4 h-4 text-orange-500" />;
      default:
        return <Globe className="w-4 h-4 text-blue-500" />;
    }
  };

  const hasScrapedContent = result?.success && (title || content);

  return (
    <Card variant="default" padding="none">
      <CardHeader className="p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>URL Scraper</CardTitle>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Manually add news by URL
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4">
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
                  sourceType === 'youtube' ? 'https://youtube.com/watch?v=... 또는 https://youtu.be/...' :
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

          {/* URL 자동 감지 알림 */}
          {url && detectSourceType(url) !== sourceType && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                URL이 {SOURCE_TYPE_LABELS[detectSourceType(url)]} 형식으로 보입니다.
                <button
                  type="button"
                  onClick={() => setSourceType(detectSourceType(url))}
                  className="ml-2 underline hover:no-underline"
                >
                  타입 변경하기
                </button>
              </p>
            </div>
          )}

          {/* Status Message */}
          {result && !result.success && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Failed to scrape URL
                </p>
                <p className="text-sm text-red-600 dark:text-red-400/80">
                  {result.error || 'An unknown error occurred'}
                </p>
              </div>
            </div>
          )}

          {result?.success && (
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
              {/* 소스 타입 배지 */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {getSourceTypeIcon(sourceType)}
                  {SOURCE_TYPE_LABELS[sourceType]}
                </span>
                {author && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    by {author}
                  </span>
                )}
              </div>

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
                className="min-h-[150px]"
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
                  setResult({ success: true });
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
      </CardContent>
    </Card>
  );
}

export default UrlScraper;
