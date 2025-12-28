'use client';

import { useEffect } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useNewsStore, useSourcesStore, useStyleTemplatesStore } from '@/store';

/**
 * Hook to synchronize Firestore listeners with authentication state.
 * Call this hook in the root layout or a top-level component to
 * automatically set up and tear down Firestore subscriptions.
 */
export function useFirestoreSync() {
  const { user, loading } = useAuthContext();

  const initNewsListener = useNewsStore((s) => s.initializeListener);
  const cleanupNews = useNewsStore((s) => s.cleanup);

  const initSourcesListener = useSourcesStore((s) => s.initializeListener);
  const cleanupSources = useSourcesStore((s) => s.cleanup);

  const initTemplatesListener = useStyleTemplatesStore((s) => s.initializeListener);
  const cleanupTemplates = useStyleTemplatesStore((s) => s.cleanup);

  useEffect(() => {
    if (loading) return;

    if (user) {
      // Initialize all Firestore listeners when user is authenticated
      initNewsListener(user.uid);
      initSourcesListener(user.uid);
      initTemplatesListener(user.uid);
    } else {
      // Clean up all listeners when user signs out
      cleanupNews();
      cleanupSources();
      cleanupTemplates();
    }

    // Cleanup on unmount
    return () => {
      cleanupNews();
      cleanupSources();
      cleanupTemplates();
    };
  }, [
    user,
    loading,
    initNewsListener,
    cleanupNews,
    initSourcesListener,
    cleanupSources,
    initTemplatesListener,
    cleanupTemplates,
  ]);
}

/**
 * Hook to get the current user ID from the auth context.
 * Returns null if not authenticated.
 */
export function useUserId(): string | null {
  const { user } = useAuthContext();
  return user?.uid ?? null;
}
