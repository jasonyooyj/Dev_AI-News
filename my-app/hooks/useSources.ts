'use client';

import { useState, useEffect, useCallback } from 'react';
import { Source } from '@/types/news';
import { getSources, saveSources, addSource as addSourceToStorage, updateSource as updateSourceInStorage, deleteSource as deleteSourceFromStorage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export function useSources() {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSources(getSources());
    setIsLoading(false);
  }, []);

  const addSource = useCallback((data: Omit<Source, 'id'>) => {
    const newSource: Source = {
      ...data,
      id: uuidv4(),
    };
    addSourceToStorage(newSource);
    setSources(getSources());
    return newSource;
  }, []);

  const updateSource = useCallback((id: string, updates: Partial<Source>) => {
    updateSourceInStorage(id, updates);
    setSources(getSources());
  }, []);

  const deleteSource = useCallback((id: string) => {
    deleteSourceFromStorage(id);
    setSources(getSources());
  }, []);

  const toggleSource = useCallback((id: string) => {
    const source = sources.find((s) => s.id === id);
    if (source) {
      updateSourceInStorage(id, { isActive: !source.isActive });
      setSources(getSources());
    }
  }, [sources]);

  const refreshSources = useCallback(() => {
    setSources(getSources());
  }, []);

  return {
    sources,
    isLoading,
    addSource,
    updateSource,
    deleteSource,
    toggleSource,
    refreshSources,
  };
}
