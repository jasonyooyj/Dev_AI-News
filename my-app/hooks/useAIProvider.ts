'use client';

import { useState, useEffect, useCallback } from 'react';

export type AIProvider = 'openai' | 'deepseek';

interface ProviderStatus {
  providers: {
    openai: boolean;
    deepseek: boolean;
  };
  defaultProvider: AIProvider | null;
  models: {
    openai: string;
    deepseek: string;
  };
}

const STORAGE_KEY = 'ai-provider-preference';

export function useAIProvider() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available providers from the API
  const fetchProviders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/openai');
      if (!response.ok) {
        throw new Error('Failed to fetch provider status');
      }
      const data: ProviderStatus = await response.json();
      setStatus(data);

      // Load saved preference or use default
      const savedProvider = localStorage.getItem(STORAGE_KEY) as AIProvider | null;
      if (savedProvider && data.providers[savedProvider]) {
        setSelectedProvider(savedProvider);
      } else if (data.defaultProvider) {
        setSelectedProvider(data.defaultProvider);
      } else if (data.providers.openai) {
        setSelectedProvider('openai');
      } else if (data.providers.deepseek) {
        setSelectedProvider('deepseek');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Change the selected provider
  const changeProvider = useCallback((provider: AIProvider) => {
    if (status?.providers[provider]) {
      setSelectedProvider(provider);
      localStorage.setItem(STORAGE_KEY, provider);
    }
  }, [status]);

  // Get the current model name
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

  return {
    status,
    selectedProvider,
    isLoading,
    error,
    changeProvider,
    getCurrentModel,
    getAvailableProviders,
    refetch: fetchProviders,
  };
}
