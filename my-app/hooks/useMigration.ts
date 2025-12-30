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
      const parseZustandState = <T>(raw: string | null, key: string, fallbackKey?: string): T[] => {
        if (!raw) return [];
        try {
          const parsed = JSON.parse(raw);
          // Zustand persist stores data in { state: { [key]: data }, version: number }
          if (parsed.state && Array.isArray(parsed.state[key])) {
            return parsed.state[key];
          }
          // Try fallback key if provided
          if (fallbackKey && parsed.state && Array.isArray(parsed.state[fallbackKey])) {
            console.log('Migration: Found data using fallback key:', fallbackKey);
            return parsed.state[fallbackKey];
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
      const styleTemplates = parseZustandState<StyleTemplate>(templatesRaw, 'templates', 'styleTemplates');

      const hasData = sources.length > 0 || newsItems.length > 0 || styleTemplates.length > 0;

      console.log('Migration Check:', {
        sourcesCount: sources.length,
        newsItemsCount: newsItems.length,
        templatesCount: styleTemplates.length,
        rawKeysFound: {
          sources: !!sourcesRaw,
          newsItems: !!newsItemsRaw,
          templates: !!templatesRaw
        }
      });

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

  // Migrate data to Firestore
  const migrateToFirestore = useCallback(async (userId: string): Promise<boolean> => {
    if (!data) {
      console.error('Migration: No data to migrate');
      return false;
    }

    setIsMigrating(true);
    setError(null);

    const total = data.sources.length + data.newsItems.length + data.styleTemplates.length;
    let completed = 0;

    console.log('Migration started:', { total, sources: data.sources.length, newsItems: data.newsItems.length, templates: data.styleTemplates.length });

    try {
      // Step 1: Migrate sources
      setProgress({ total, completed, currentStep: 'sources' });
      console.log('Migration: Starting sources migration');

      if (data.sources.length > 0) {
        // Remove id field before migrating, but keep everything else including optional dates
        const sourcesWithoutId = data.sources.map(({ id, ...rest }) => rest);
        console.log('Migration: Adding sources to Firestore', sourcesWithoutId.length);
        await batchAddSources(userId, sourcesWithoutId);
        completed += data.sources.length;
        setProgress({ total, completed, currentStep: 'sources' });
        console.log('Migration: Sources completed', completed, '/', total);
      } else {
        console.log('Migration: No sources to migrate');
      }

      // Step 2: Migrate news items
      setProgress({ total, completed, currentStep: 'newsItems' });
      console.log('Migration: Starting news items migration');

      if (data.newsItems.length > 0) {
        // Migrate in batches of 500 (Firestore limit)
        const BATCH_SIZE = 500;
        for (let i = 0; i < data.newsItems.length; i += BATCH_SIZE) {
          const batch = data.newsItems.slice(i, i + BATCH_SIZE);
          // Keep createdAt if it exists to preserve history
          const itemsWithoutId = batch.map(({ id, ...rest }) => ({
            ...rest
          }));
          console.log('Migration: Adding news items batch', i / BATCH_SIZE + 1, 'of', Math.ceil(data.newsItems.length / BATCH_SIZE));
          await batchAddNewsItems(userId, itemsWithoutId);
          completed += batch.length;
          setProgress({ total, completed, currentStep: 'newsItems' });
          console.log('Migration: News items progress', completed, '/', total);
        }
      } else {
        console.log('Migration: No news items to migrate');
      }

      // Step 3: Migrate style templates
      setProgress({ total, completed, currentStep: 'styleTemplates' });
      console.log('Migration: Starting style templates migration');

      if (data.styleTemplates.length > 0) {
        const templatesWithoutId = data.styleTemplates.map(
          ({ id, ...rest }) => rest
        );
        console.log('Migration: Adding style templates to Firestore', templatesWithoutId.length);
        await batchAddStyleTemplates(userId, templatesWithoutId);
        completed += data.styleTemplates.length;
        setProgress({ total, completed, currentStep: 'styleTemplates' });
        console.log('Migration: Style templates completed', completed, '/', total);
      } else {
        console.log('Migration: No style templates to migrate');
      }

      // Done
      setProgress({ total, completed, currentStep: 'done' });
      console.log('Migration: Complete!', completed, '/', total);
      setIsMigrating(false);

      // Clear localStorage after successful migration
      clearLocalStorage();

      return true;
    } catch (err) {
      console.error('Migration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Migration failed';
      console.error('Migration error details:', {
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        completed,
        total,
      });
      setError(errorMessage);
      setIsMigrating(false);
      setProgress({ total, completed, currentStep: 'sources' }); // Reset progress on error
      return false;
    }
  }, [data, clearLocalStorage]);

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
