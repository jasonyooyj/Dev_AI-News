'use client';

import { useState } from 'react';
import { Send, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { SocialConnection } from '@/types/news';

interface BlueskyPublishButtonProps {
  content: string;
  connection: SocialConnection | null;
  linkUrl?: string;
  onSuccess?: (postUrl: string) => void;
  onError?: (error: string) => void;
  onConnectClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function BlueskyPublishButton({
  content,
  connection,
  linkUrl,
  onSuccess,
  onError,
  onConnectClick,
  disabled,
  className,
}: BlueskyPublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isConnected = connection?.isConnected && connection?.credentials?.identifier;

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

    if (content.length > 300) {
      setError('Content exceeds 300 character limit');
      onError?.('Content exceeds 300 character limit');
      return;
    }

    setIsPublishing(true);
    setError(null);
    setPublishedUrl(null);

    try {
      const result = await api.social.bluesky.post({
        identifier: connection.credentials.identifier!,
        appPassword: connection.credentials.appPassword!,
        text: content,
        linkUrl,
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
          className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
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
          <svg viewBox="0 0 568 501" fill="currentColor" className="w-4 h-4">
            <path d="M123.121 33.6637C188.241 82.5526 258.281 181.681 284 234.873C309.719 181.681 379.759 82.5526 444.879 33.6637C491.866 -1.61183 568 -28.9064 568 57.9464C568 75.2916 558.055 203.659 552.222 224.501C531.947 296.954 458.067 315.434 392.347 304.249C507.222 323.8 536.444 388.56 473.333 453.32C353.473 576.312 301.061 422.461 287.631 383.039C285.169 375.012 284.017 372.431 284 375.306C283.983 372.431 282.831 375.012 280.369 383.039C266.939 422.461 214.527 576.312 94.6667 453.32C31.5556 388.56 60.7778 323.8 175.653 304.249C109.933 315.434 36.0535 296.954 15.7778 224.501C9.94525 203.659 0 75.2916 0 57.9464C0 -28.9064 76.1345 -1.61183 123.121 33.6637Z" />
          </svg>
        }
      >
        Connect Bluesky
      </Button>
    );
  }

  // Ready to publish state
  return (
    <Button
      onClick={handlePublish}
      isLoading={isPublishing}
      disabled={disabled || !content.trim() || content.length > 300}
      className={className}
      leftIcon={<Send className="w-4 h-4" />}
      style={{ backgroundColor: '#0085FF' }}
    >
      {isPublishing ? 'Publishing...' : 'Post to Bluesky'}
    </Button>
  );
}

export default BlueskyPublishButton;
