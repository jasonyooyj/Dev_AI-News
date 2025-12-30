'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ExternalLink, AlertCircle, Check, Link2 } from 'lucide-react';
import type { SocialConnection } from '@/types/news';

interface LinkedInPublishButtonProps {
  content: string;
  connection: SocialConnection | null;
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  onSuccess?: (postUrl: string) => void;
  onConnectClick?: () => void;
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function LinkedInPublishButton({
  content,
  connection,
  linkUrl,
  linkTitle,
  linkDescription,
  onSuccess,
  onConnectClick,
}: LinkedInPublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const isConnected = connection?.isConnected;
  const charCount = content.length;
  const maxChars = 3000;
  const isOverLimit = charCount > maxChars;

  // Check if token is expired
  const isTokenExpired = () => {
    if (!connection?.credentials?.expiresAt) return false;
    return new Date(connection.credentials.expiresAt) < new Date();
  };

  const handlePublish = async () => {
    if (!connection?.credentials?.accessToken || !connection?.credentials?.identifier) {
      setError('LinkedIn credentials not found. Please reconnect.');
      return;
    }

    if (isTokenExpired()) {
      setError('Your LinkedIn session has expired. Please reconnect.');
      return;
    }

    if (isOverLimit) {
      setError(`Content exceeds ${maxChars} character limit`);
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const response = await fetch('/api/social/linkedin/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: connection.credentials.accessToken,
          personUrn: connection.credentials.identifier, // personUrn stored as identifier
          text: content,
          articleUrl: linkUrl,
          articleTitle: linkTitle,
          articleDescription: linkDescription,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to publish to LinkedIn');
      }

      const data = await response.json();
      setPublishedUrl(data.post.postUrl);
      onSuccess?.(data.post.postUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="space-y-2">
        <Button
          variant="secondary"
          onClick={onConnectClick}
          leftIcon={<LinkedInIcon className="w-4 h-4" />}
          className="w-full"
        >
          Connect LinkedIn to Publish
        </Button>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
          Connect your account to post directly
        </p>
      </div>
    );
  }

  // Token expired state
  if (isTokenExpired()) {
    return (
      <div className="space-y-2">
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Session expired
              </p>
              <p className="text-amber-600 dark:text-amber-300 mt-1">
                Your LinkedIn session has expired. Please reconnect to continue posting.
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={onConnectClick}
          leftIcon={<LinkedInIcon className="w-4 h-4" />}
          className="w-full"
        >
          Reconnect LinkedIn
        </Button>
      </div>
    );
  }

  // Published state
  if (publishedUrl) {
    return (
      <div className="space-y-2">
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Check className="w-5 h-5" />
            <span className="font-medium">Published to LinkedIn!</span>
          </div>
        </div>
        <a
          href={publishedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          View on LinkedIn
        </a>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-2">
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-700 dark:text-red-400">
                Failed to publish
              </p>
              <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setError(null);
            handlePublish();
          }}
          className="w-full"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Ready to publish state
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <LinkedInIcon className="w-4 h-4 text-[#0077B5]" />
          <span>@{connection.handle}</span>
        </div>
        <span className={`${isOverLimit ? 'text-red-500' : 'text-zinc-400'}`}>
          {charCount}/{maxChars}
        </span>
      </div>

      {linkUrl && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
          <Link2 className="w-3 h-3" />
          <span className="truncate">Article link will be attached</span>
        </div>
      )}

      <Button
        variant="primary"
        onClick={handlePublish}
        disabled={isPublishing || isOverLimit}
        leftIcon={
          isPublishing ? (
            <Spinner size="sm" />
          ) : (
            <LinkedInIcon className="w-4 h-4" />
          )
        }
        className="w-full bg-[#0077B5] hover:bg-[#006097]"
      >
        {isPublishing ? 'Publishing...' : 'Publish to LinkedIn'}
      </Button>
    </div>
  );
}

export default LinkedInPublishButton;
