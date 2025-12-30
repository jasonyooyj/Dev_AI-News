'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getSocialConnections,
  getSocialConnectionByPlatform,
  addSocialConnection,
  disconnectSocialPlatform,
  subscribeToSocialConnections,
  addPublishHistory,
} from '@/lib/firebase/firestore';
import type { SocialConnection, SocialPlatform, PublishResult } from '@/types/news';
import { toast } from 'sonner';

interface UseSocialConnectionsReturn {
  connections: SocialConnection[];
  isLoading: boolean;
  error: Error | null;
  getConnection: (platform: SocialPlatform) => SocialConnection | null;
  connectBluesky: (data: {
    handle: string;
    credentials: {
      identifier: string;
      appPassword: string;
    };
  }) => Promise<void>;
  connectThreads: (data: {
    username: string;
    credentials: {
      accessToken: string;
      userId: string;
      expiresAt: string;
    };
  }) => Promise<void>;
  connectLinkedIn: (data: {
    name: string;
    credentials: {
      accessToken: string;
      personUrn: string;
      expiresAt: string;
      refreshToken?: string;
    };
  }) => Promise<void>;
  connectInstagram: (data: {
    username: string;
    credentials: {
      accessToken: string;
      userId: string;
      expiresAt: string;
    };
  }) => Promise<void>;
  disconnect: (platform: SocialPlatform) => Promise<void>;
  savePublishResult: (
    newsItemId: string,
    content: string,
    results: PublishResult[]
  ) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSocialConnections(): UseSocialConnectionsReturn {
  const { user } = useAuth();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch connections on mount
  useEffect(() => {
    if (!user) {
      setConnections([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToSocialConnections(
      user.uid,
      (updatedConnections) => {
        setConnections(updatedConnections);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching social connections:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Get a specific connection by platform
  const getConnection = useCallback(
    (platform: SocialPlatform): SocialConnection | null => {
      return connections.find((c) => c.platform === platform) || null;
    },
    [connections]
  );

  // Connect Bluesky account
  const connectBluesky = useCallback(
    async (data: {
      handle: string;
      credentials: {
        identifier: string;
        appPassword: string;
      };
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        await addSocialConnection(user.uid, {
          platform: 'bluesky',
          handle: data.handle,
          isConnected: true,
          credentials: {
            identifier: data.credentials.identifier,
            appPassword: data.credentials.appPassword,
          },
        });

        toast.success('Bluesky account connected successfully');
      } catch (err) {
        console.error('Error connecting Bluesky:', err);
        toast.error('Failed to connect Bluesky account');
        throw err;
      }
    },
    [user]
  );

  // Connect Threads account
  const connectThreads = useCallback(
    async (data: {
      username: string;
      credentials: {
        accessToken: string;
        userId: string;
        expiresAt: string;
      };
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        await addSocialConnection(user.uid, {
          platform: 'threads',
          handle: data.username,
          isConnected: true,
          credentials: {
            identifier: data.credentials.userId,
            accessToken: data.credentials.accessToken,
            expiresAt: data.credentials.expiresAt,
          },
        });

        toast.success('Threads account connected successfully');
      } catch (err) {
        console.error('Error connecting Threads:', err);
        toast.error('Failed to connect Threads account');
        throw err;
      }
    },
    [user]
  );

  // Connect LinkedIn account
  const connectLinkedIn = useCallback(
    async (data: {
      name: string;
      credentials: {
        accessToken: string;
        personUrn: string;
        expiresAt: string;
        refreshToken?: string;
      };
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        await addSocialConnection(user.uid, {
          platform: 'linkedin',
          handle: data.name,
          isConnected: true,
          credentials: {
            identifier: data.credentials.personUrn,
            accessToken: data.credentials.accessToken,
            expiresAt: data.credentials.expiresAt,
            refreshToken: data.credentials.refreshToken,
          },
        });

        toast.success('LinkedIn account connected successfully');
      } catch (err) {
        console.error('Error connecting LinkedIn:', err);
        toast.error('Failed to connect LinkedIn account');
        throw err;
      }
    },
    [user]
  );

  // Connect Instagram account
  const connectInstagram = useCallback(
    async (data: {
      username: string;
      credentials: {
        accessToken: string;
        userId: string;
        expiresAt: string;
      };
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        await addSocialConnection(user.uid, {
          platform: 'instagram',
          handle: data.username,
          isConnected: true,
          credentials: {
            identifier: data.credentials.userId,
            accessToken: data.credentials.accessToken,
            expiresAt: data.credentials.expiresAt,
          },
        });

        toast.success('Instagram account connected successfully');
      } catch (err) {
        console.error('Error connecting Instagram:', err);
        toast.error('Failed to connect Instagram account');
        throw err;
      }
    },
    [user]
  );

  // Disconnect a platform
  const disconnect = useCallback(
    async (platform: SocialPlatform) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        await disconnectSocialPlatform(user.uid, platform);
        toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected`);
      } catch (err) {
        console.error('Error disconnecting platform:', err);
        toast.error('Failed to disconnect account');
        throw err;
      }
    },
    [user]
  );

  // Save publish result to history
  const savePublishResult = useCallback(
    async (newsItemId: string, content: string, results: PublishResult[]) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        await addPublishHistory(user.uid, {
          newsItemId,
          content,
          results,
        });
      } catch (err) {
        console.error('Error saving publish history:', err);
        // Don't throw - this is non-critical
      }
    },
    [user]
  );

  // Manual refetch
  const refetch = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updatedConnections = await getSocialConnections(user.uid);
      setConnections(updatedConnections);
      setError(null);
    } catch (err) {
      console.error('Error refetching connections:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch connections'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    connections,
    isLoading,
    error,
    getConnection,
    connectBluesky,
    connectThreads,
    connectLinkedIn,
    connectInstagram,
    disconnect,
    savePublishResult,
    refetch,
  };
}

export default useSocialConnections;
