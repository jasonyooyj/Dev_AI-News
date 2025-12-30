'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import {
  SocialConnectionCard,
  BlueskyConnectModal,
  ThreadsConnectModal,
  LinkedInConnectModal,
  InstagramConnectModal,
} from '@/components/social';
import { useSources } from '@/hooks/useSources';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { Link2, ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import type { SocialPlatform } from '@/types/news';

const AVAILABLE_PLATFORMS: SocialPlatform[] = ['bluesky', 'threads', 'linkedin', 'instagram'];

const PLATFORM_STATUS: Record<SocialPlatform, 'available' | 'coming_soon'> = {
  bluesky: 'available',
  threads: 'available',
  linkedin: 'available',
  instagram: 'available',
};

export default function ConnectionsPage() {
  const { sources } = useSources();
  const {
    connections,
    isLoading,
    getConnection,
    connectBluesky,
    connectThreads,
    connectLinkedIn,
    connectInstagram,
    disconnect,
  } = useSocialConnections();

  const [isBlueskyModalOpen, setIsBlueskyModalOpen] = useState(false);
  const [isThreadsModalOpen, setIsThreadsModalOpen] = useState(false);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [isInstagramModalOpen, setIsInstagramModalOpen] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null);

  const handleConnect = (platform: SocialPlatform) => {
    if (platform === 'bluesky') {
      setIsBlueskyModalOpen(true);
    } else if (platform === 'threads') {
      setIsThreadsModalOpen(true);
    } else if (platform === 'linkedin') {
      setIsLinkedInModalOpen(true);
    } else if (platform === 'instagram') {
      setIsInstagramModalOpen(true);
    }
  };

  const handleDisconnect = async (platform: SocialPlatform) => {
    setConnectingPlatform(platform);
    try {
      await disconnect(platform);
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleBlueskySuccess = async (profile: {
    did: string;
    handle: string;
    displayName?: string;
    avatar?: string;
    credentials: {
      identifier: string;
      appPassword: string;
    };
  }) => {
    setConnectingPlatform('bluesky');
    try {
      await connectBluesky({
        handle: profile.handle,
        credentials: profile.credentials,
      });
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleThreadsSuccess = async (data: {
    id: string;
    username: string;
    name?: string;
    profilePictureUrl?: string;
    credentials: {
      accessToken: string;
      userId: string;
      expiresAt: string;
    };
  }) => {
    setConnectingPlatform('threads');
    try {
      await connectThreads({
        username: data.username,
        credentials: data.credentials,
      });
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleLinkedInSuccess = async (data: {
    sub: string;
    name: string;
    email: string;
    picture?: string;
    credentials: {
      accessToken: string;
      personUrn: string;
      expiresAt: string;
      refreshToken?: string;
    };
  }) => {
    setConnectingPlatform('linkedin');
    try {
      await connectLinkedIn({
        name: data.name,
        credentials: data.credentials,
      });
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleInstagramSuccess = async (data: {
    id: string;
    username: string;
    name?: string;
    profilePictureUrl?: string;
    credentials: {
      accessToken: string;
      userId: string;
      expiresAt: string;
    };
  }) => {
    setConnectingPlatform('instagram');
    try {
      await connectInstagram({
        username: data.username,
        credentials: data.credentials,
      });
    } finally {
      setConnectingPlatform(null);
    }
  };

  if (isLoading) {
    return (
      <MainLayout sources={sources}>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout sources={sources}>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Link2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Social Connections
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                Connect your social media accounts to publish content directly
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card variant="bordered" padding="md" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Privacy & Security</p>
              <p className="text-blue-700 dark:text-blue-300">
                Your credentials are stored securely and only used to post on your behalf.
                You can disconnect your accounts at any time. We never store your main passwords.
              </p>
            </div>
          </div>
        </Card>

        {/* Connections List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Available Platforms
          </h2>

          {AVAILABLE_PLATFORMS.map((platform) => {
            const status = PLATFORM_STATUS[platform];
            const connection = getConnection(platform);

            if (status === 'coming_soon') {
              return (
                <Card key={platform} variant="bordered" padding="md" className="opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800">
                        {platform === 'threads' && (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-zinc-400">
                            <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.812-.674 1.928-1.077 3.23-1.166.93-.064 1.89-.025 2.854.115.09-.542.132-1.123.119-1.73-.032-1.655-.592-2.587-1.768-2.94-.545-.163-1.187-.207-1.907-.132-.72.076-1.327.27-1.806.577-.574.37-.996.907-1.257 1.598l-1.953-.583c.377-1.016.998-1.84 1.847-2.452.75-.54 1.63-.894 2.615-1.052.984-.158 1.975-.132 2.944.077 2.18.473 3.49 1.882 3.537 4.377.018.93-.058 1.78-.222 2.527 1.09.474 1.955 1.183 2.528 2.112.767 1.244 1.02 2.878.535 4.49-.694 2.305-2.396 3.854-5.063 4.604-1.076.303-2.263.441-3.54.412zm.893-7.74c-.078-1.873-1.405-2.574-2.802-2.478-1.197.082-2.478.698-2.399 2.232.048.918.447 1.528 1.187 1.817.737.287 1.624.32 2.49.015 1.083-.383 1.476-1.039 1.524-1.586z" />
                          </svg>
                        )}
                        {platform === 'linkedin' && (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-zinc-400">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        )}
                        {platform === 'instagram' && (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-zinc-400">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-zinc-600 dark:text-zinc-400 capitalize">
                          {platform}
                        </h3>
                        <span className="text-xs text-zinc-500 dark:text-zinc-500">
                          Coming soon
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            }

            return (
              <SocialConnectionCard
                key={platform}
                platform={platform}
                connection={connection}
                onConnect={() => handleConnect(platform)}
                onDisconnect={() => handleDisconnect(platform)}
                onReconnect={() => handleConnect(platform)}
                isLoading={connectingPlatform === platform}
              />
            );
          })}
        </div>

        {/* Connected Accounts Summary */}
        {connections.length > 0 && (
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {connections.filter((c) => c.isConnected).length} account(s) connected
            </p>
          </div>
        )}
      </div>

      {/* Bluesky Connect Modal */}
      <BlueskyConnectModal
        isOpen={isBlueskyModalOpen}
        onClose={() => setIsBlueskyModalOpen(false)}
        onSuccess={handleBlueskySuccess}
      />

      {/* Threads Connect Modal */}
      <ThreadsConnectModal
        isOpen={isThreadsModalOpen}
        onClose={() => setIsThreadsModalOpen(false)}
        onSuccess={handleThreadsSuccess}
      />

      {/* LinkedIn Connect Modal */}
      <LinkedInConnectModal
        isOpen={isLinkedInModalOpen}
        onClose={() => setIsLinkedInModalOpen(false)}
        onSuccess={handleLinkedInSuccess}
      />

      {/* Instagram Connect Modal */}
      <InstagramConnectModal
        isOpen={isInstagramModalOpen}
        onClose={() => setIsInstagramModalOpen(false)}
        onSuccess={handleInstagramSuccess}
      />
    </MainLayout>
  );
}
