'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch connections on mount
  const fetchConnections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social/connections');
      if (!response.ok) throw new Error('Failed to fetch connections');
      const data = await response.json();
      setConnections(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching social connections:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch connections'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Get a specific connection by platform
  const getConnection = useCallback(
    (platform: SocialPlatform): SocialConnection | null => {
      return connections.find((c) => c.platform === platform) || null;
    },
    [connections]
  );

  // Helper to save connection
  const saveConnection = async (data: {
    platform: SocialPlatform;
    handle: string;
    isConnected: boolean;
    credentials: Record<string, string | undefined>;
  }) => {
    const response = await fetch('/api/social/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save connection');
    }

    await fetchConnections();
  };

  // Connect Bluesky account
  const connectBluesky = useCallback(
    async (data: {
      handle: string;
      credentials: {
        identifier: string;
        appPassword: string;
      };
    }) => {
      try {
        await saveConnection({
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
    []
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
      try {
        await saveConnection({
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
    []
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
      try {
        await saveConnection({
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
    []
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
      try {
        await saveConnection({
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
    []
  );

  // Disconnect a platform
  const disconnect = useCallback(
    async (platform: SocialPlatform) => {
      const connection = connections.find((c) => c.platform === platform);
      if (!connection) return;

      try {
        const response = await fetch(`/api/social/connections/${connection.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to disconnect');

        await fetchConnections();
        toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected`);
      } catch (err) {
        console.error('Error disconnecting platform:', err);
        toast.error('Failed to disconnect account');
        throw err;
      }
    },
    [connections, fetchConnections]
  );

  // Save publish result to history
  const savePublishResult = useCallback(
    async (newsItemId: string, content: string, results: PublishResult[]) => {
      try {
        await fetch('/api/publish-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newsItemId, content, results }),
        });
      } catch (err) {
        console.error('Error saving publish history:', err);
        // Don't throw - this is non-critical
      }
    },
    []
  );

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
    refetch: fetchConnections,
  };
}

export default useSocialConnections;
