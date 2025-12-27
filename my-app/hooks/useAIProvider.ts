'use client';

import { useCallback, useMemo } from 'react';
import { useAIProviderStore } from '@/store';
import { useProviderStatus } from './queries';

export type AIProvider = 'openai' | 'deepseek';

/**
 * useAIProvider - Migrated to use Zustand store + TanStack Query
 *
 * Provider preference is persisted via Zustand
 * Provider status is fetched via TanStack Query with caching
 */
export function useAIProvider() {
  // Zustand store state
  const selectedProvider = useAIProviderStore((s) => s.provider);
  const setProvider = useAIProviderStore((s) => s.setProvider);

  // TanStack Query for provider status
  const {
    data: status,
    isLoading,
    error: queryError,
    refetch,
  } = useProviderStatus();

  // Error state
  const error = queryError?.message || null;

  // Change provider (with validation)
  const changeProvider = useCallback(
    (provider: AIProvider) => {
      if (status?.providers[provider]) {
        setProvider(provider);
      }
    },
    [status, setProvider]
  );

  // Get current model name
  const getCurrentModel = useCallback(() => {
    if (!selectedProvider || !status) return null;
    return status.models[selectedProvider];
  }, [selectedProvider, status]);

  // Get available providers as an array
  const getAvailableProviders = useCallback((): AIProvider[] => {
    if (!status) return [];
    const available: AIProvider[] = [];
    if (status.providers.openai) available.push('openai');
    if (status.providers.deepseek) available.push('deepseek');
    return available;
  }, [status]);

  // Memoized current model
  const currentModel = useMemo(() => getCurrentModel(), [getCurrentModel]);

  // Memoized available providers
  const availableProviders = useMemo(() => getAvailableProviders(), [getAvailableProviders]);

  return {
    status: status || null,
    selectedProvider,
    isLoading,
    error,
    changeProvider,
    getCurrentModel,
    getAvailableProviders,
    refetch,
    // Convenience values
    currentModel,
    availableProviders,
  };
}
