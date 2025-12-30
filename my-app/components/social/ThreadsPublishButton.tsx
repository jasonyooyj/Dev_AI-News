'use client';

import { useState } from 'react';
import { Send, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { SocialConnection } from '@/types/news';

interface ThreadsPublishButtonProps {
  content: string;
  connection: SocialConnection | null;
  imageUrl?: string;
  onSuccess?: (postUrl: string) => void;
  onError?: (error: string) => void;
  onConnectClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ThreadsPublishButton({
  content,
  connection,
  imageUrl,
  onSuccess,
  onError,
  onConnectClick,
  disabled,
  className,
}: ThreadsPublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isConnected = connection?.isConnected && connection?.credentials?.accessToken;

  const handlePublish = async () => {
    if (!isConnected || !connection?.credentials) {
      onConnectClick?.();
      return;
    }

    if (!content.trim()) {
      setError('No content to publish');
      onError?.('No content to publish');
      return;
    }

    if (content.length > 500) {
      setError('Content exceeds 500 character limit');
      onError?.('Content exceeds 500 character limit');
      return;
    }

    // Check if token is expired
    if (connection.credentials.expiresAt) {
      const expiresAt = new Date(connection.credentials.expiresAt);
      if (expiresAt < new Date()) {
        setError('Token expired. Please reconnect your account.');
        onError?.('Token expired. Please reconnect your account.');
        return;
      }
    }

    setIsPublishing(true);
    setError(null);
    setPublishedUrl(null);

    try {
      const result = await api.social.threads.post({
        accessToken: connection.credentials.accessToken!,
        userId: connection.credentials.identifier!, // userId stored as identifier
        text: content,
        imageUrl,
      });

      setPublishedUrl(result.post.postUrl);
      onSuccess?.(result.post.postUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  // Already published state
  if (publishedUrl) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Published</span>
        </div>
        <a
          href={publishedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:underline"
        >
          View post
          <ExternalLink className="w-3 h-3" />
        </a>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPublishedUrl(null)}
          className="text-xs"
        >
          Publish again
        </Button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setError(null)}
        >
          Try again
        </Button>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={onConnectClick}
        disabled={disabled}
        className={className}
        leftIcon={
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.812-.674 1.928-1.077 3.23-1.166.93-.064 1.89-.025 2.854.115.09-.542.132-1.123.119-1.73-.032-1.655-.592-2.587-1.768-2.94-.545-.163-1.187-.207-1.907-.132-.72.076-1.327.27-1.806.577-.574.37-.996.907-1.257 1.598l-1.953-.583c.377-1.016.998-1.84 1.847-2.452.75-.54 1.63-.894 2.615-1.052.984-.158 1.975-.132 2.944.077 2.18.473 3.49 1.882 3.537 4.377.018.93-.058 1.78-.222 2.527 1.09.474 1.955 1.183 2.528 2.112.767 1.244 1.02 2.878.535 4.49-.694 2.305-2.396 3.854-5.063 4.604-1.076.303-2.263.441-3.54.412zm.893-7.74c-.078-1.873-1.405-2.574-2.802-2.478-1.197.082-2.478.698-2.399 2.232.048.918.447 1.528 1.187 1.817.737.287 1.624.32 2.49.015 1.083-.383 1.476-1.039 1.524-1.586z" />
          </svg>
        }
      >
        Connect Threads
      </Button>
    );
  }

  // Ready to publish state
  return (
    <Button
      onClick={handlePublish}
      isLoading={isPublishing}
      disabled={disabled || !content.trim() || content.length > 500}
      className={className}
      leftIcon={<Send className="w-4 h-4" />}
      style={{ backgroundColor: '#000000' }}
    >
      {isPublishing ? 'Publishing...' : 'Post to Threads'}
    </Button>
  );
}

export default ThreadsPublishButton;
