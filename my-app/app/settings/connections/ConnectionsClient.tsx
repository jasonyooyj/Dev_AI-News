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

export function ConnectionsClient() {
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
                        <span className="text-zinc-400 capitalize">{platform[0]}</span>
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

      {/* Modals */}
      <BlueskyConnectModal
        isOpen={isBlueskyModalOpen}
        onClose={() => setIsBlueskyModalOpen(false)}
        onSuccess={handleBlueskySuccess}
      />
      <ThreadsConnectModal
        isOpen={isThreadsModalOpen}
        onClose={() => setIsThreadsModalOpen(false)}
        onSuccess={handleThreadsSuccess}
      />
      <LinkedInConnectModal
        isOpen={isLinkedInModalOpen}
        onClose={() => setIsLinkedInModalOpen(false)}
        onSuccess={handleLinkedInSuccess}
      />
      <InstagramConnectModal
        isOpen={isInstagramModalOpen}
        onClose={() => setIsInstagramModalOpen(false)}
        onSuccess={handleInstagramSuccess}
      />
    </MainLayout>
  );
}
