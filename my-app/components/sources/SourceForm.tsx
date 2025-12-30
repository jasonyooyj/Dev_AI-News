'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Rss, Link2, Youtube, Globe } from 'lucide-react';
import { SourceType, SOURCE_TYPE_LABELS } from '@/types/news';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Source } from '@/types/news';
import { sourceFormSchema, SourceFormData } from '@/lib/validations';

interface SourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (source: Omit<Source, 'id' | 'lastFetchedAt'>) => void;
  source?: Source | null;
  isLoading?: boolean;
}

export function SourceForm({
  isOpen,
  onClose,
  onSubmit,
  source,
  isLoading = false,
}: SourceFormProps) {
  const isEditing = !!source;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SourceFormData>({
    resolver: zodResolver(sourceFormSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'rss' as SourceType,
      websiteUrl: '',
      rssUrl: '',
      isActive: true,
    },
  });

  const isActive = watch('isActive');
  const selectedType = watch('type') as SourceType;

  useEffect(() => {
    if (source) {
      reset({
        name: source.name,
        description: source.description || '',
        type: source.type || 'rss',
        websiteUrl: source.websiteUrl,
        rssUrl: source.rssUrl || '',
        isActive: source.isActive,
      });
    } else {
      reset({
        name: '',
        description: '',
        type: 'rss',
        websiteUrl: '',
        rssUrl: '',
        isActive: true,
      });
    }
  }, [source, isOpen, reset]);

  const onFormSubmit = (data: SourceFormData) => {
    onSubmit({
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      type: data.type || 'rss',
      websiteUrl: data.websiteUrl.trim(),
      rssUrl: data.rssUrl?.trim() || undefined,
      isActive: data.isActive,
      priority: source?.priority || 'medium',
    });
  };

  // 소스 타입별 아이콘
  const getSourceTypeIcon = (type: SourceType) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      case 'twitter':
        return <span className="w-4 h-4 font-bold text-xs flex items-center justify-center">𝕏</span>;
      case 'threads':
        return <span className="w-4 h-4 font-bold text-xs flex items-center justify-center">@</span>;
      case 'blog':
        return <Globe className="w-4 h-4" />;
      default:
        return <Rss className="w-4 h-4" />;
    }
  };

  // 소스 타입별 URL placeholder
  const getUrlPlaceholder = (type: SourceType) => {
    switch (type) {
      case 'youtube':
        return 'https://www.youtube.com/@channel 또는 https://youtu.be/video_id';
      case 'twitter':
        return 'https://x.com/username 또는 https://twitter.com/username/status/...';
      case 'threads':
        return 'https://threads.net/@username/post/...';
      case 'blog':
        return 'https://example.com/blog';
      default:
        return 'https://example.com';
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Source' : 'Add New Source'}
      description={
        isEditing
          ? 'Update the source information below.'
          : 'Add a new news source to fetch articles from.'
      }
      size="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 sm:space-y-5">
        {/* 소스 타입 선택 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Source Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {(['rss', 'youtube', 'twitter', 'threads', 'blog'] as SourceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue('type', type)}
                className={`
                  flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-all
                  ${selectedType === type
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }
                `}
              >
                {getSourceTypeIcon(type)}
                <span className="text-xs font-medium">{SOURCE_TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Source Name"
          placeholder="e.g., TechCrunch AI News"
          {...register('name')}
          error={errors.name?.message}
          leftIcon={<Link2 className="w-4 h-4" />}
          required
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description
          </label>
          <textarea
            {...register('description')}
            placeholder="Brief description of this news source..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
          />
          {errors.description?.message && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <Input
          label={selectedType === 'rss' ? 'Website URL' : `${SOURCE_TYPE_LABELS[selectedType]} URL`}
          placeholder={getUrlPlaceholder(selectedType)}
          {...register('websiteUrl')}
          error={errors.websiteUrl?.message}
          type="url"
          leftIcon={getSourceTypeIcon(selectedType)}
          helperText={
            selectedType === 'youtube' ? 'YouTube 채널 또는 비디오 URL' :
            selectedType === 'twitter' ? 'X/Twitter 프로필 또는 포스트 URL' :
            selectedType === 'threads' ? 'Threads 프로필 또는 포스트 URL' :
            selectedType === 'blog' ? '블로그/웹사이트 URL' :
            'The main website URL of the news source'
          }
          required
        />

        {/* RSS 타입일 때만 RSS Feed URL 표시 */}
        {selectedType === 'rss' && (
          <Input
            label="RSS Feed URL"
            placeholder="https://example.com/feed.xml"
            {...register('rssUrl')}
            error={errors.rssUrl?.message}
            type="url"
            leftIcon={<Rss className="w-4 h-4" />}
            helperText="Optional: Add an RSS feed URL for automatic fetching"
          />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Active Status
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isActive
                ? 'This source will be included in automatic fetches'
                : 'This source is disabled and will not be fetched'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setValue('isActive', !isActive)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              dark:focus:ring-offset-zinc-900
              ${isActive ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform
                ${isActive ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        <ModalFooter className="-mx-5 -mb-5 mt-6">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {isEditing ? 'Update Source' : 'Add Source'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default SourceForm;
