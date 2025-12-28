'use client';

import { useState, useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';
import {
  batchAddNewsItems,
  batchAddSources,
  batchAddStyleTemplates,
} from '@/lib/firebase/firestore';
import type { NewsItem, Source, StyleTemplate } from '@/types/news';

export interface MigrationData {
  sources: Source[];
  newsItems: NewsItem[];
  styleTemplates: StyleTemplate[];
}

export interface MigrationProgress {
  total: number;
  completed: number;
  currentStep: 'sources' | 'newsItems' | 'styleTemplates' | 'done';
}

export interface MigrationState {
  hasMigratableData: boolean;
  isChecking: boolean;
  isMigrating: boolean;
  progress: MigrationProgress | null;
  error: string | null;
  data: MigrationData | null;
}

export interface MigrationActions {
  checkLocalStorage: () => void;
  migrateToFirestore: (userId: string) => Promise<boolean>;
  clearLocalStorage: () => void;
  dismissMigration: () => void;
}

const MIGRATION_DISMISSED_KEY = 'ai-news-migration-dismissed';

export function useMigration(): MigrationState & MigrationActions {
  const [hasMigratableData, setHasMigratableData] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MigrationData | null>(null);

  // Check if migration was previously dismissed
  const wasDismissed = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(MIGRATION_DISMISSED_KEY) === 'true';
  }, []);

  // Check localStorage for migratable data
  const checkLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') {
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // If migration was dismissed, don't show again
      if (wasDismissed()) {
        setHasMigratableData(false);
        setIsChecking(false);
        return;
      }

      const sourcesRaw = localStorage.getItem(STORAGE_KEYS.SOURCES);
      const newsItemsRaw = localStorage.getItem(STORAGE_KEYS.NEWS_ITEMS);
      const templatesRaw = localStorage.getItem(STORAGE_KEYS.STYLE_TEMPLATES);

      // Parse Zustand persist format
      const parseZustandState = <T>(raw: string | null, key: string): T[] => {
        if (!raw) return [];
        try {
          const parsed = JSON.parse(raw);
          // Zustand persist stores data in { state: { [key]: data }, version: number }
          if (parsed.state && Array.isArray(parsed.state[key])) {
            return parsed.state[key];
          }
          // Fallback to direct array
          if (Array.isArray(parsed)) {
            return parsed;
          }
          return [];
        } catch {
          return [];
        }
      };

      const sources = parseZustandState<Source>(sourcesRaw, 'sources');
      const newsItems = parseZustandState<NewsItem>(newsItemsRaw, 'newsItems');
      const styleTemplates = parseZustandState<StyleTemplate>(templatesRaw, 'templates');

      const hasData = sources.length > 0 || newsItems.length > 0 || styleTemplates.length > 0;

      setData({
        sources,
        newsItems,
        styleTemplates,
      });

      setHasMigratableData(hasData);
    } catch (err) {
      console.error('Error checking localStorage:', err);
      setError('Failed to check local storage data');
      setHasMigratableData(false);
    } finally {
      setIsChecking(false);
    }
  }, [wasDismissed]);

  // Migrate data to Firestore
  const migrateToFirestore = useCallback(async (userId: string): Promise<boolean> => {
    if (!data) return false;

    setIsMigrating(true);
    setError(null);

    const total = data.sources.length + data.newsItems.length + data.styleTemplates.length;
    let completed = 0;

    try {
      // Step 1: Migrate sources
      setProgress({ total, completed, currentStep: 'sources' });

      if (data.sources.length > 0) {
        // Remove id field from sources before migrating
        const sourcesWithoutId = data.sources.map(({ id, ...rest }) => rest);
        await batchAddSources(userId, sourcesWithoutId);
        completed += data.sources.length;
        setProgress({ total, completed, currentStep: 'sources' });
      }

      // Step 2: Migrate news items
      setProgress({ total, completed, currentStep: 'newsItems' });

      if (data.newsItems.length > 0) {
        // Migrate in batches of 500 (Firestore limit)
        const BATCH_SIZE = 500;
        for (let i = 0; i < data.newsItems.length; i += BATCH_SIZE) {
          const batch = data.newsItems.slice(i, i + BATCH_SIZE);
          const itemsWithoutId = batch.map(({ id, createdAt, ...rest }) => ({
            ...rest,
            // Keep createdAt but let it be converted
          }));
          await batchAddNewsItems(userId, itemsWithoutId as Omit<NewsItem, 'id' | 'createdAt'>[]);
          completed += batch.length;
          setProgress({ total, completed, currentStep: 'newsItems' });
        }
      }

      // Step 3: Migrate style templates
      setProgress({ total, completed, currentStep: 'styleTemplates' });

      if (data.styleTemplates.length > 0) {
        const templatesWithoutId = data.styleTemplates.map(
          ({ id, createdAt, updatedAt, ...rest }) => rest
        );
        await batchAddStyleTemplates(userId, templatesWithoutId);
        completed += data.styleTemplates.length;
        setProgress({ total, completed, currentStep: 'styleTemplates' });
      }

      // Done
      setProgress({ total, completed, currentStep: 'done' });
      setIsMigrating(false);

      // Clear localStorage after successful migration
      clearLocalStorage();

      return true;
    } catch (err) {
      console.error('Migration error:', err);
      setError(err instanceof Error ? err.message : 'Migration failed');
      setIsMigrating(false);
      return false;
    }
  }, [data]);

  // Clear localStorage data
  const clearLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEYS.SOURCES);
      localStorage.removeItem(STORAGE_KEYS.NEWS_ITEMS);
      localStorage.removeItem(STORAGE_KEYS.STYLE_TEMPLATES);
      localStorage.removeItem(STORAGE_KEYS.PROCESSED_NEWS);
      setHasMigratableData(false);
      setData(null);
    } catch (err) {
      console.error('Error clearing localStorage:', err);
    }
  }, []);

  // Dismiss migration (don't show again)
  const dismissMigration = useCallback(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(MIGRATION_DISMISSED_KEY, 'true');
    setHasMigratableData(false);
  }, []);

  // Check localStorage on mount
  useEffect(() => {
    checkLocalStorage();
  }, [checkLocalStorage]);

  return {
    hasMigratableData,
    isChecking,
    isMigrating,
    progress,
    error,
    data,
    checkLocalStorage,
    migrateToFirestore,
    clearLocalStorage,
    dismissMigration,
  };
}
