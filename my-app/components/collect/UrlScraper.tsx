'use client';

import { useState, FormEvent } from 'react';
import {
  Link2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

interface ScrapeResult {
  success: boolean;
  title?: string;
  content?: string;
  error?: string;
}

interface UrlScraperProps {
  onScrape?: (url: string) => Promise<ScrapeResult>;
  onSave?: (data: { url: string; title: string; content: string }) => void;
}

export function UrlScraper({ onScrape, onSave }: UrlScraperProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [urlError, setUrlError] = useState('');

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

    if (!validateUrl(url) || !onScrape) return;

    setIsScraping(true);
    setResult(null);
    setTitle('');
    setContent('');

    try {
      const scrapeResult = await onScrape(url);
      setResult(scrapeResult);

      if (scrapeResult.success) {
        setTitle(scrapeResult.title || '');
        setContent(scrapeResult.content || '');
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
      });

      // Reset form on success
      setUrl('');
      setTitle('');
      setContent('');
      setResult(null);
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
    setResult(null);
    setUrlError('');
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
          {/* URL Input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Input
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (urlError) validateUrl(e.target.value);
                }}
                error={urlError}
                leftIcon={<Link2 className="w-4 h-4" />}
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
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title"
              />

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
