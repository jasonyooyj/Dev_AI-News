'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ExternalLink,
  Clock,
  FileText,
  Wand2,
  ListChecks,
  ChevronDown,
  Check,
  Bookmark,
} from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { useNewsStore } from '@/store';
import { PlatformPreview } from '@/components/social/PlatformPreview';
import { FeedbackButtons } from '@/components/social/FeedbackButtons';
import {
  NewsItem,
  Source,
  Platform,
  PlatformContent,
  StyleTemplate,
  QuickSummary,
  NewsCategory,
  NEWS_CATEGORY_LABELS,
  PLATFORM_CONFIGS,
} from '@/types/news';

// Platform icons as inline SVG components
interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

function TwitterIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function ThreadsIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.812-.674 1.928-1.077 3.23-1.166.93-.064 1.89-.025 2.854.115.09-.542.132-1.123.119-1.73-.032-1.655-.592-2.587-1.768-2.94-.545-.163-1.187-.207-1.907-.132-.72.076-1.327.27-1.806.577-.574.37-.996.907-1.257 1.598l-1.953-.583c.377-1.016.998-1.84 1.847-2.452.75-.54 1.63-.894 2.615-1.052.984-.158 1.975-.132 2.944.077 2.18.473 3.49 1.882 3.537 4.377.018.93-.058 1.78-.222 2.527 1.09.474 1.955 1.183 2.528 2.112.767 1.244 1.02 2.878.535 4.49-.694 2.305-2.396 3.854-5.063 4.604-1.076.303-2.263.441-3.54.412zm.893-7.74c-.078-1.873-1.405-2.574-2.802-2.478-1.197.082-2.478.698-2.399 2.232.048.918.447 1.528 1.187 1.817.737.287 1.624.32 2.49.015 1.083-.383 1.476-1.039 1.524-1.586z" />
    </svg>
  );
}

function InstagramIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function LinkedInIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const PlatformIcons: Record<Platform, React.ComponentType<IconProps>> = {
  twitter: TwitterIcon,
  threads: ThreadsIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
};

interface NewsDetailProps {
  isOpen: boolean;
  onClose: () => void;
  news: NewsItem | null;
  source?: Source;
  onGenerateContent: (platform: Platform, styleTemplateId?: string) => Promise<PlatformContent | null>;
  onRegenerateWithFeedback: (platform: Platform, feedback: string) => Promise<PlatformContent | null>;
  onBookmark?: (news: NewsItem) => void;
  styleTemplates: StyleTemplate[];
  isGenerating: boolean;
  generatedContents: Partial<Record<Platform, PlatformContent>>;
}

type TabType = 'summary' | 'full-article' | 'generate';

const CATEGORY_BADGE_VARIANTS: Record<NewsCategory, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  product: 'info',
  update: 'success',
  research: 'warning',
  announcement: 'default',
  other: 'default',
};

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

// Tab component
interface TabProps {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

function Tab({ id, label, icon, isActive, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
        ${
          isActive
            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}

// Style Template Dropdown component
interface StyleTemplateDropdownProps {
  platform: Platform;
  templates: StyleTemplate[];
  selectedTemplateId: string | undefined;
  onSelect: (templateId: string | undefined) => void;
}

function StyleTemplateDropdown({
  platform,
  templates,
  selectedTemplateId,
  onSelect,
}: StyleTemplateDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const platformTemplates = templates.filter((t) => t.platform === platform);
  const selectedTemplate = platformTemplates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
      >
        <span className="text-zinc-700 dark:text-zinc-300">
          {selectedTemplate ? selectedTemplate.name : 'Default Style'}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => {
                onSelect(undefined);
                setIsOpen(false);
              }}
              className={`
                flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors
                ${!selectedTemplateId ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}
              `}
            >
              <span>Default Style</span>
              {!selectedTemplateId && <Check className="w-4 h-4" />}
            </button>
            {platformTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onSelect(template.id);
                  setIsOpen(false);
                }}
                className={`
                  flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors
                  ${selectedTemplateId === template.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}
                `}
              >
                <div>
                  <span className="block">{template.name}</span>
                  {template.tone && (
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {template.tone}
                    </span>
                  )}
                </div>
                {selectedTemplateId === template.id && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>
            ))}
            {platformTemplates.length === 0 && (
              <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 italic">
                No custom templates yet
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Summary Tab Content
function SummaryTabContent({ quickSummary }: { quickSummary?: QuickSummary }) {
  if (!quickSummary) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <ListChecks className="w-8 h-8 text-zinc-400" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">
            No summary available
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This news item hasn&apos;t been summarized yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant={CATEGORY_BADGE_VARIANTS[quickSummary.category]}
          size="md"
        >
          {NEWS_CATEGORY_LABELS[quickSummary.category]}
        </Badge>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Summarized {formatDate(quickSummary.createdAt)}
        </span>
      </div>

      {/* Summary Bullets */}
      <Card variant="default" padding="lg">
        <h4 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
          Key Points
        </h4>
        <ul className="space-y-3">
          {quickSummary.bullets.map((bullet, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {bullet}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// Full Article Tab Content - uses store for persistent caching
function FullArticleTabContent({
  url,
  title,
  savedTranslation,
  onSaveTranslation,
}: {
  url: string;
  title: string;
  savedTranslation?: string;  // From store (persistent)
  onSaveTranslation: (content: string) => void;  // Save to store
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<'fetching' | 'translating'>('fetching');
  const hasFetchedRef = useRef(false);

  // Use saved translation if available
  const displayContent = savedTranslation;

  // Fetch and translate full article content
  const fetchAndTranslateArticle = async () => {
    if (hasFetchedRef.current || savedTranslation) return; // Already loaded or saved
    hasFetchedRef.current = true;

    setIsLoading(true);
    setError(null);
    setLoadingStep('fetching');

    try {
      // Step 1: Fetch the article
      const scrapeResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!scrapeResponse.ok) {
        throw new Error('Failed to fetch article');
      }

      const scrapeData = await scrapeResponse.json();
      const rawContent = scrapeData.content || '';

      if (!rawContent || rawContent.length < 50) {
        const fallbackMsg = '콘텐츠를 가져올 수 없습니다. 원문 링크를 확인해주세요.';
        onSaveTranslation(fallbackMsg);
        return;
      }

      // Step 2: Translate and format
      setLoadingStep('translating');

      const translateResponse = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'translate',
          title,
          content: rawContent,
        }),
      });

      if (!translateResponse.ok) {
        // If translation fails, save raw content
        onSaveTranslation(rawContent);
        return;
      }

      const translateData = await translateResponse.json();
      const finalContent = translateData.content || rawContent;
      // Save to store for persistence
      onSaveTranslation(finalContent);
    } catch (err) {
      setError('기사를 불러오는데 실패했습니다. 원문 링크를 확인해주세요.');
      console.error('Failed to fetch/translate article:', err);
      hasFetchedRef.current = false; // Allow retry on error
    } finally {
      setIsLoading(false);
    }
  };

  // Reset ref when URL changes
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [url]);

  // Fetch on mount if not saved
  useEffect(() => {
    if (!savedTranslation && !hasFetchedRef.current) {
      fetchAndTranslateArticle();
    }
  }, [savedTranslation, url]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Spinner size="lg" />
        <div className="text-center">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {loadingStep === 'fetching' ? '기사 가져오는 중...' : '번역 및 포맷팅 중...'}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {loadingStep === 'fetching'
              ? '원문을 스크래핑하고 있습니다'
              : 'AI가 한국어로 번역하고 있습니다'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchAndTranslateArticle}>
            다시 시도
          </Button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            원문 보기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Translated badge */}
      <div className="flex items-center gap-2">
        <Badge variant="info" size="sm">
          한국어 번역
        </Badge>
      </div>

      {/* Article content with Notion-style markdown rendering */}
      <div className="bg-white dark:bg-zinc-900/80 rounded-lg p-4 sm:p-6 md:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <article className="prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {displayContent || ''}
          </ReactMarkdown>
        </article>
      </div>

      {/* Original link */}
      <div className="flex items-center justify-between pt-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          원문 보기
        </a>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          AI 번역 · 원문과 다를 수 있습니다
        </span>
      </div>
    </div>
  );
}

// Generate Content Tab Content
function GenerateContentTabContent({
  platforms,
  selectedPlatform,
  onSelectPlatform,
  styleTemplates,
  selectedTemplateIds,
  onSelectTemplate,
  onGenerate,
  isGenerating,
  generatedContent,
  onThumbsUp,
  onRegenerateWithFeedback,
}: {
  platforms: Platform[];
  selectedPlatform: Platform;
  onSelectPlatform: (platform: Platform) => void;
  styleTemplates: StyleTemplate[];
  selectedTemplateIds: Partial<Record<Platform, string>>;
  onSelectTemplate: (platform: Platform, templateId: string | undefined) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generatedContent?: PlatformContent;
  onThumbsUp: () => void;
  onRegenerateWithFeedback: (feedback: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Platform Selector Buttons */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Select Platform
        </label>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => {
            const config = PLATFORM_CONFIGS[platform];
            const Icon = PlatformIcons[platform];
            const isSelected = selectedPlatform === platform;

            return (
              <button
                key={platform}
                onClick={() => onSelectPlatform(platform)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${
                    isSelected
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {config.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Style Template Selector */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Writing Style
        </label>
        <StyleTemplateDropdown
          platform={selectedPlatform}
          templates={styleTemplates}
          selectedTemplateId={selectedTemplateIds[selectedPlatform]}
          onSelect={(templateId) => onSelectTemplate(selectedPlatform, templateId)}
        />
      </div>

      {/* Generate Button */}
      <Button
        variant="primary"
        size="lg"
        onClick={onGenerate}
        disabled={isGenerating}
        isLoading={isGenerating}
        leftIcon={!isGenerating ? <Wand2 className="w-5 h-5" /> : undefined}
        className="w-full"
      >
        {isGenerating ? 'Generating...' : `Generate for ${PLATFORM_CONFIGS[selectedPlatform].name}`}
      </Button>

      {/* Generated Content Preview */}
      {isGenerating && !generatedContent && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Spinner size="lg" />
          <div className="text-center">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              Generating content...
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Crafting the perfect post for {PLATFORM_CONFIGS[selectedPlatform].name}
            </p>
          </div>
        </div>
      )}

      {generatedContent && (
        <div className="space-y-4">
          <PlatformPreview
            platform={selectedPlatform}
            content={generatedContent}
          />

          {/* Feedback Buttons */}
          <FeedbackButtons
            onThumbsUp={onThumbsUp}
            onRegenerate={(feedback) => {
              if (feedback) {
                onRegenerateWithFeedback(feedback);
              } else {
                onGenerate();
              }
            }}
            isRegenerating={isGenerating}
          />
        </div>
      )}
    </div>
  );
}

export function NewsDetail({
  isOpen,
  onClose,
  news,
  source,
  onGenerateContent,
  onRegenerateWithFeedback,
  onBookmark,
  styleTemplates,
  isGenerating,
  generatedContents,
}: NewsDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('twitter');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Partial<Record<Platform, string>>>({});

  // Get save function from store
  const saveTranslation = useNewsStore((s) => s.saveTranslation);

  const platforms = Object.keys(PLATFORM_CONFIGS) as Platform[];
  const isBookmarked = news?.isBookmarked ?? false;

  // Reset tab when news changes
  useEffect(() => {
    setActiveTab('summary');
  }, [news?.id]);

  if (!news) return null;

  // Handler to save translation to store
  const handleSaveTranslation = (content: string) => {
    saveTranslation(news.id, content);
  };

  const handleGenerate = async () => {
    const templateId = selectedTemplateIds[selectedPlatform];
    await onGenerateContent(selectedPlatform, templateId);
  };

  const handleRegenerateWithFeedback = async (feedback: string) => {
    await onRegenerateWithFeedback(selectedPlatform, feedback);
  };

  const handleSelectTemplate = (platform: Platform, templateId: string | undefined) => {
    setSelectedTemplateIds((prev) => ({
      ...prev,
      [platform]: templateId,
    }));
  };

  const handleThumbsUp = () => {
    // Could save to style examples or mark as good
    console.log('Content marked as good for', selectedPlatform);
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
          <div className="flex gap-1 overflow-x-auto">
            <Tab
              id="summary"
              label="Summary"
              icon={<ListChecks className="w-4 h-4" />}
              isActive={activeTab === 'summary'}
              onClick={() => setActiveTab('summary')}
            />
            <Tab
              id="full-article"
              label="Full Article"
              icon={<FileText className="w-4 h-4" />}
              isActive={activeTab === 'full-article'}
              onClick={() => setActiveTab('full-article')}
            />
            <Tab
              id="generate"
              label="Generate Content"
              icon={<Wand2 className="w-4 h-4" />}
              isActive={activeTab === 'generate'}
              onClick={() => setActiveTab('generate')}
            />
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'summary' && (
          <SummaryTabContent quickSummary={news.quickSummary} />
        )}

        {activeTab === 'full-article' && (
          <FullArticleTabContent
            url={news.url}
            title={news.title}
            savedTranslation={news.translatedContent}
            onSaveTranslation={handleSaveTranslation}
          />
        )}

        {activeTab === 'generate' && (
          <GenerateContentTabContent
            platforms={platforms}
            selectedPlatform={selectedPlatform}
            onSelectPlatform={setSelectedPlatform}
            styleTemplates={styleTemplates}
            selectedTemplateIds={selectedTemplateIds}
            onSelectTemplate={handleSelectTemplate}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            generatedContent={generatedContents[selectedPlatform]}
            onThumbsUp={handleThumbsUp}
            onRegenerateWithFeedback={handleRegenerateWithFeedback}
          />
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="ghost"
          onClick={() => onBookmark?.(news)}
          className={isBookmarked
            ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            : "text-zinc-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          }
          leftIcon={<Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />}
        >
          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </Button>
        <Button
          variant="secondary"
          onClick={handleViewOriginal}
          leftIcon={<ExternalLink className="w-4 h-4" />}
        >
          View Original
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default NewsDetail;
