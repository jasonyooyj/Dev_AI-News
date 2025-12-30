'use client';

import { useEffect } from 'react';
import { useNewsStore, useSourcesStore, useStyleTemplatesStore } from '@/store';

export function useDataInit() {
  const { fetchNews, isInitialized: newsInitialized } = useNewsStore();
  const { fetchSources, isInitialized: sourcesInitialized } = useSourcesStore();
  const { fetchTemplates, isInitialized: templatesInitialized } = useStyleTemplatesStore();

  useEffect(() => {
    // Always fetch data on mount (no authentication required)
    if (!newsInitialized) {
      fetchNews();
    }
    if (!sourcesInitialized) {
      fetchSources();
    }
    if (!templatesInitialized) {
      fetchTemplates();
    }
  }, [
    fetchNews,
    fetchSources,
    fetchTemplates,
    newsInitialized,
    sourcesInitialized,
    templatesInitialized,
  ]);

  return {
    isLoading: false,
    isAuthenticated: true, // Always "authenticated" for public access
  };
}
