'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useNewsStore, useSourcesStore, useStyleTemplatesStore } from '@/store';

export function useDataInit() {
  const { data: session, status } = useSession();
  const { fetchNews, reset: resetNews, isInitialized: newsInitialized } = useNewsStore();
  const { fetchSources, reset: resetSources, isInitialized: sourcesInitialized } = useSourcesStore();
  const { fetchTemplates, reset: resetTemplates, isInitialized: templatesInitialized } = useStyleTemplatesStore();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Fetch data if not already initialized
      if (!newsInitialized) {
        fetchNews();
      }
      if (!sourcesInitialized) {
        fetchSources();
      }
      if (!templatesInitialized) {
        fetchTemplates();
      }
    } else if (status === 'unauthenticated') {
      // Reset stores when user logs out
      resetNews();
      resetSources();
      resetTemplates();
    }
  }, [
    status,
    session,
    fetchNews,
    fetchSources,
    fetchTemplates,
    resetNews,
    resetSources,
    resetTemplates,
    newsInitialized,
    sourcesInitialized,
    templatesInitialized,
  ]);

  return {
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
