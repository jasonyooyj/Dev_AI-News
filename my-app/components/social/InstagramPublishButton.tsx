'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import type { SocialConnection } from '@/types/news';
import {
  Camera,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ImagePlus,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface InstagramPublishButtonProps {
  connection: SocialConnection | null;
  content: string;
  onConnect: () => void;
  onReconnect: () => void;
  onPublished?: (postUrl: string) => void;
}

type PublishState = 'idle' | 'image_required' | 'publishing' | 'published' | 'error';

export function InstagramPublishButton({
  connection,
  content,
  onConnect,
  onReconnect,
  onPublished,
}: InstagramPublishButtonProps) {
  const [state, setState] = useState<PublishState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [postUrl, setPostUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);

  const isConnected = connection?.isConnected ?? false;
  const isExpired = connection?.credentials?.expiresAt
    ? new Date(connection.credentials.expiresAt) < new Date()
    : false;

  const handlePublishClick = () => {
    if (!isConnected) {
      onConnect();
      return;
    }

    if (isExpired) {
      onReconnect();
      return;
    }

    // Open modal for image URL
    setIsModalOpen(true);
    setState('image_required');
  };

  const validateImageUrl = (url: string): boolean => {
    if (!url.trim()) {
      setImageError('Image URL is required');
      return false;
    }

    if (!url.startsWith('https://')) {
      setImageError('Image URL must use HTTPS');
      return false;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setImageError('Invalid URL format');
      return false;
    }

    setImageError(null);
    return true;
  };

  const handlePublish = async () => {
    if (!validateImageUrl(imageUrl)) {
      return;
    }

    if (!connection?.credentials?.accessToken || !connection?.credentials?.identifier) {
      setError('Missing credentials. Please reconnect your account.');
      setState('error');
      return;
    }

    setState('publishing');
    setError(null);

    try {
      const result = await api.social.instagram.post({
        accessToken: connection.credentials.accessToken,
        userId: connection.credentials.identifier,
        imageUrl: imageUrl.trim(),
        caption: content,
      });

      if (result.success) {
        setState('published');
        setPostUrl(result.post.postUrl);
        toast.success('Posted to Instagram!');
        onPublished?.(result.post.postUrl);

        // Close modal after brief delay
        setTimeout(() => {
          setIsModalOpen(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Instagram publish error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish';
      setError(errorMessage);
      setState('error');
      toast.error(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setImageUrl('');
    setImageError(null);
    if (state !== 'published') {
      setState('idle');
    }
    setError(null);
  };

  const handleRetry = () => {
    setState('image_required');
    setError(null);
  };

  // Render button based on connection state
  const renderButton = () => {
    // Not connected
    if (!isConnected) {
      return (
        <Button
          onClick={onConnect}
          variant="secondary"
          size="sm"
          className="gap-2"
        >
          <Camera className="w-4 h-4" />
          Connect Instagram
        </Button>
      );
    }

    // Token expired
    if (isExpired) {
      return (
        <Button
          onClick={onReconnect}
          variant="secondary"
          size="sm"
          className="gap-2 text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
        >
          <RefreshCw className="w-4 h-4" />
          Reconnect Instagram
        </Button>
      );
    }

    // Already published
    if (state === 'published' && postUrl) {
      return (
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700"
          onClick={() => window.open(postUrl, '_blank')}
        >
          <CheckCircle2 className="w-4 h-4" />
          View on Instagram
          <ExternalLink className="w-3 h-3" />
        </Button>
      );
    }

    // Ready to publish
    return (
      <Button
        onClick={handlePublishClick}
        variant="secondary"
        size="sm"
        className="gap-2 hover:bg-gradient-to-r hover:from-purple-50 hover:via-pink-50 hover:to-orange-50 dark:hover:from-purple-900/20 dark:hover:via-pink-900/20 dark:hover:to-orange-900/20"
      >
        <Camera className="w-4 h-4 text-pink-500" />
        Post to Instagram
      </Button>
    );
  };

  return (
    <>
      {renderButton()}

      {/* Image URL Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Post to Instagram"
      >
        <div className="space-y-4">
          {/* Image requirement info */}
          <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              Instagram requires an image for every post. The image must be publicly accessible via HTTPS URL.
            </div>
          </div>

          {state === 'image_required' && (
            <>
              {/* Image URL input */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Image URL
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        if (imageError) setImageError(null);
                      }}
                      className={imageError ? 'border-red-500' : ''}
                    />
                    {imageError && (
                      <p className="mt-1 text-xs text-red-500">{imageError}</p>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Must be a direct link to an image (JPG, PNG, etc.)
                </p>
              </div>

              {/* Caption preview */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Caption
                </label>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {content}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {content.length} / 2,200 characters
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={!imageUrl.trim()}
                  className="gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 text-white"
                >
                  <Send className="w-4 h-4" />
                  Publish
                </Button>
              </div>
            </>
          )}

          {state === 'publishing' && (
            <div className="text-center py-8">
              <Spinner size="lg" className="mx-auto mb-4" />
              <p className="text-zinc-600 dark:text-zinc-400">
                Publishing to Instagram...
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
                This may take a moment while the image is processed
              </p>
            </div>
          )}

          {state === 'published' && postUrl && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Posted!
              </h3>
              <a
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-pink-600 hover:text-pink-700 dark:text-pink-400"
              >
                View on Instagram
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
                Failed to Post
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                {error}
              </p>
              <Button onClick={handleRetry} variant="secondary">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
