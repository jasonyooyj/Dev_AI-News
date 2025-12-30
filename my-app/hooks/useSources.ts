'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useSourcesStore } from '@/store';
import { Source } from '@/types/news';

/**
 * useSources - Migrated to use Zustand store with API backend
 *
 * Data is fetched from the API by useDataInit hook
 * initDefaults is called by fetchSources when no sources exist
 */
export function useSources() {
  // Zustand store state and actions
  const sources = useSourcesStore((s) => s.sources);
  const isLoading = useSourcesStore((s) => s.isLoading);
  const addSourceToStore = useSourcesStore((s) => s.addSource);
  const updateSourceInStore = useSourcesStore((s) => s.updateSource);
  const deleteSourceFromStore = useSourcesStore((s) => s.deleteSource);

  // Add source
  const addSource = useCallback(
    (data: Omit<Source, 'id'>) => {
      addSourceToStore(data);
      toast.success(`Source "${data.name}" added`);
    },
    [addSourceToStore]
  );

  // Update source
  const updateSource = useCallback(
    (id: string, updates: Partial<Source>) => {
      updateSourceInStore(id, updates);
      toast.success('Source updated');
    },
    [updateSourceInStore]
  );

  // Delete source
  const deleteSource = useCallback(
    (id: string) => {
      const source = sources.find((s) => s.id === id);
      deleteSourceFromStore(id);
      toast.success(`Source "${source?.name || ''}" deleted`);
    },
    [sources, deleteSourceFromStore]
  );

  // Toggle source active state
  const toggleSource = useCallback(
    (id: string) => {
      const source = sources.find((s) => s.id === id);
      if (source) {
        updateSourceInStore(id, { isActive: !source.isActive });
        toast.success(
          source.isActive ? `Source "${source.name}" disabled` : `Source "${source.name}" enabled`
        );
      }
    },
    [sources, updateSourceInStore]
  );

  // Refresh sources (no-op with Zustand - state is always fresh)
  const refreshSources = useCallback(() => {
    // Zustand state is reactive, no refresh needed
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
