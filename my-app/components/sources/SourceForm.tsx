'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Rss, Link2 } from 'lucide-react';
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
      websiteUrl: '',
      rssUrl: '',
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  useEffect(() => {
    if (source) {
      reset({
        name: source.name,
        websiteUrl: source.websiteUrl,
        rssUrl: source.rssUrl || '',
        isActive: source.isActive,
      });
    } else {
      reset({
        name: '',
        websiteUrl: '',
        rssUrl: '',
        isActive: true,
      });
    }
  }, [source, isOpen, reset]);

  const onFormSubmit = (data: SourceFormData) => {
    onSubmit({
      name: data.name.trim(),
      websiteUrl: data.websiteUrl.trim(),
      rssUrl: data.rssUrl?.trim() || undefined,
      isActive: data.isActive,
    });
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
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        <Input
          label="Source Name"
          placeholder="e.g., TechCrunch AI News"
          {...register('name')}
          error={errors.name?.message}
          leftIcon={<Link2 className="w-4 h-4" />}
          required
        />

        <Input
          label="Website URL"
          placeholder="https://example.com"
          {...register('websiteUrl')}
          error={errors.websiteUrl?.message}
          type="url"
          leftIcon={<Link2 className="w-4 h-4" />}
          helperText="The main website URL of the news source"
          required
        />

        <Input
          label="RSS Feed URL"
          placeholder="https://example.com/feed.xml"
          {...register('rssUrl')}
          error={errors.rssUrl?.message}
          type="url"
          leftIcon={<Rss className="w-4 h-4" />}
          helperText="Optional: Add an RSS feed URL for automatic fetching"
        />

        <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
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
