import { create } from 'zustand';
import { Source, NewsItem, StyleTemplate, Platform, QuickSummary } from '@/types/news';
import {
  subscribeToNewsItems,
  subscribeToSources,
  subscribeToStyleTemplates,
  addNewsItem as firestoreAddNewsItem,
  updateNewsItem as firestoreUpdateNewsItem,
  deleteNewsItem as firestoreDeleteNewsItem,
  addSummaryToNewsItem,
  saveTranslation as firestoreSaveTranslation,
  toggleBookmark as firestoreToggleBookmark,
  addSource as firestoreAddSource,
  updateSource as firestoreUpdateSource,
  deleteSource as firestoreDeleteSource,
  addStyleTemplate as firestoreAddStyleTemplate,
  updateStyleTemplate as firestoreUpdateStyleTemplate,
  deleteStyleTemplate as firestoreDeleteStyleTemplate,
  setDefaultStyleTemplate,
  batchAddSources,
} from '@/lib/firebase/firestore';
import { DEFAULT_SOURCES } from '@/lib/constants';
import type { Unsubscribe } from 'firebase/firestore';

// ============ News Store ============
interface NewsState {
  newsItems: NewsItem[];
  isLoading: boolean;
  userId: string | null;
  unsubscribe: Unsubscribe | null;

  // Firestore integration
  initializeListener: (userId: string) => void;
  cleanup: () => void;

  // Actions (these now sync with Firestore)
  addNewsItem: (item: Omit<NewsItem, 'id' | 'createdAt'>) => Promise<string | null>;
  updateNewsItem: (id: string, updates: Partial<NewsItem>) => Promise<void>;
  deleteNewsItem: (id: string) => Promise<void>;
  setNewsItems: (items: NewsItem[]) => void;
  addSummary: (id: string, summary: QuickSummary) => Promise<void>;
  toggleBookmark: (id: string) => Promise<void>;
  saveTranslation: (id: string, translatedContent: string) => Promise<void>;
}

export const useNewsStore = create<NewsState>((set, get) => ({
  newsItems: [],
  isLoading: true,
  userId: null,
  unsubscribe: null,

  initializeListener: (userId: string) => {
    // Clean up existing listener
    get().cleanup();

    set({ userId, isLoading: true });

    const unsubscribe = subscribeToNewsItems(
      userId,
      (items) => {
        set({ newsItems: items, isLoading: false });
      },
      (error) => {
        console.error('News items subscription error:', error);
        set({ isLoading: false });
      }
    );

    set({ unsubscribe });
  },

  cleanup: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null, userId: null, newsItems: [], isLoading: true });
    }
  },

  addNewsItem: async (item) => {
    const { userId } = get();
    if (!userId) return null;

    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const tempItem: NewsItem = {
      ...item,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      newsItems: [tempItem, ...state.newsItems],
    }));

    try {
      const id = await firestoreAddNewsItem(userId, item);
      // Firestore listener will update the state with the real item
      return id;
    } catch (error) {
      // Rollback on error
      set((state) => ({
        newsItems: state.newsItems.filter((n) => n.id !== tempId),
      }));
      console.error('Error adding news item:', error);
      return null;
    }
  },

  updateNewsItem: async (id, updates) => {
    const { userId, newsItems } = get();
    if (!userId) return;

    // Optimistic update
    const previousItems = newsItems;
    set((state) => ({
      newsItems: state.newsItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));

    try {
      await firestoreUpdateNewsItem(userId, id, updates);
    } catch (error) {
      // Rollback on error
      set({ newsItems: previousItems });
      console.error('Error updating news item:', error);
    }
  },

  deleteNewsItem: async (id) => {
    const { userId, newsItems } = get();
    if (!userId) return;

    // Optimistic update
    const previousItems = newsItems;
    set((state) => ({
      newsItems: state.newsItems.filter((item) => item.id !== id),
    }));

    try {
      await firestoreDeleteNewsItem(userId, id);
    } catch (error) {
      // Rollback on error
      set({ newsItems: previousItems });
      console.error('Error deleting news item:', error);
    }
  },

  setNewsItems: (items) => {
    set({ newsItems: items });
  },

  addSummary: async (id, summary) => {
    const { userId, newsItems } = get();
    if (!userId) return;

    // Optimistic update
    const previousItems = newsItems;
    set((state) => ({
      newsItems: state.newsItems.map((item) =>
        item.id === id ? { ...item, quickSummary: summary, isProcessed: true } : item
      ),
    }));

    try {
      await addSummaryToNewsItem(userId, id, summary);
    } catch (error) {
      // Rollback on error
      set({ newsItems: previousItems });
      console.error('Error adding summary:', error);
    }
  },

  toggleBookmark: async (id) => {
    const { userId, newsItems } = get();
    if (!userId) return;

    // Optimistic update
    const previousItems = newsItems;
    set((state) => ({
      newsItems: state.newsItems.map((item) =>
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
      ),
    }));

    try {
      await firestoreToggleBookmark(userId, id);
    } catch (error) {
      // Rollback on error
      set({ newsItems: previousItems });
      console.error('Error toggling bookmark:', error);
    }
  },

  saveTranslation: async (id, translatedContent) => {
    const { userId, newsItems } = get();
    if (!userId) return;

    // Optimistic update
    const previousItems = newsItems;
    set((state) => ({
      newsItems: state.newsItems.map((item) =>
        item.id === id
          ? { ...item, translatedContent, translatedAt: new Date().toISOString() }
          : item
      ),
    }));

    try {
      await firestoreSaveTranslation(userId, id, translatedContent);
    } catch (error) {
      // Rollback on error
      set({ newsItems: previousItems });
      console.error('Error saving translation:', error);
    }
  },
}));

// ============ Sources Store ============
interface SourcesState {
  sources: Source[];
  isLoading: boolean;
  userId: string | null;
  unsubscribe: Unsubscribe | null;

  // Firestore integration
  initializeListener: (userId: string) => void;
  cleanup: () => void;

  // Actions
  addSource: (source: Omit<Source, 'id'>) => Promise<string | null>;
  updateSource: (id: string, updates: Partial<Source>) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;
  setSources: (sources: Source[]) => void;
  initDefaults: () => Promise<void>;
  removeDuplicates: () => Promise<void>;
}

export const useSourcesStore = create<SourcesState>((set, get) => ({
  sources: [],
  isLoading: true,
  userId: null,
  unsubscribe: null,

  initializeListener: (userId: string) => {
    // Clean up existing listener
    get().cleanup();

    set({ userId, isLoading: true });

    const unsubscribe = subscribeToSources(
      userId,
      (sources) => {
        set({ sources, isLoading: false });

        // Initialize defaults if no sources exist
        if (sources.length === 0) {
          get().initDefaults();
        }
      },
      (error) => {
        console.error('Sources subscription error:', error);
        set({ isLoading: false });
      }
    );

    set({ unsubscribe });
  },

  cleanup: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null, userId: null, sources: [], isLoading: true });
    }
  },

  addSource: async (source) => {
    const { userId, sources } = get();
    if (!userId) return null;

    // Check for duplicate by websiteUrl
    const isDuplicate = sources.some(
      (s) => s.websiteUrl.toLowerCase() === source.websiteUrl.toLowerCase()
    );
    if (isDuplicate) {
      console.warn('Source with this URL already exists:', source.websiteUrl);
      return null;
    }

    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const tempSource: Source = {
      ...source,
      id: tempId,
    };

    set((state) => ({
      sources: [...state.sources, tempSource],
    }));

    try {
      const id = await firestoreAddSource(userId, source);
      return id;
    } catch (error) {
      // Rollback on error
      set((state) => ({
        sources: state.sources.filter((s) => s.id !== tempId),
      }));
      console.error('Error adding source:', error);
      return null;
    }
  },

  updateSource: async (id, updates) => {
    const { userId, sources } = get();
    if (!userId) return;

    // Optimistic update
    const previousSources = sources;
    set((state) => ({
      sources: state.sources.map((source) =>
        source.id === id ? { ...source, ...updates } : source
      ),
    }));

    try {
      await firestoreUpdateSource(userId, id, updates);
    } catch (error) {
      // Rollback on error
      set({ sources: previousSources });
      console.error('Error updating source:', error);
    }
  },

  deleteSource: async (id) => {
    const { userId, sources } = get();
    if (!userId) return;

    // Optimistic update
    const previousSources = sources;
    set((state) => ({
      sources: state.sources.filter((source) => source.id !== id),
    }));

    try {
      await firestoreDeleteSource(userId, id);
    } catch (error) {
      // Rollback on error
      set({ sources: previousSources });
      console.error('Error deleting source:', error);
    }
  },

  setSources: (sources) => {
    set({ sources });
  },

  initDefaults: async () => {
    const { userId, sources } = get();
    if (!userId) return;

    try {
      // Get existing source URLs to avoid duplicates
      const existingUrls = new Set(
        sources.map((s) => s.websiteUrl.toLowerCase())
      );

      // Filter out sources that already exist
      const newSources = DEFAULT_SOURCES
        .filter((s) => !existingUrls.has(s.websiteUrl.toLowerCase()))
        .map(({ id, ...rest }) => rest);

      if (newSources.length > 0) {
        await batchAddSources(userId, newSources);
      }
    } catch (error) {
      console.error('Error initializing default sources:', error);
    }
  },

  // Remove duplicate sources (keeps the first occurrence)
  removeDuplicates: async () => {
    const { userId, sources } = get();
    if (!userId) return;

    const seen = new Map<string, string>(); // url -> id (first occurrence)
    const duplicateIds: string[] = [];

    for (const source of sources) {
      const url = source.websiteUrl.toLowerCase();
      if (seen.has(url)) {
        duplicateIds.push(source.id);
      } else {
        seen.set(url, source.id);
      }
    }

    if (duplicateIds.length === 0) {
      console.log('No duplicate sources found');
      return;
    }

    console.log(`Removing ${duplicateIds.length} duplicate sources...`);

    // Delete duplicates
    for (const id of duplicateIds) {
      try {
        await firestoreDeleteSource(userId, id);
      } catch (error) {
        console.error('Error deleting duplicate source:', id, error);
      }
    }
  },
}));

// ============ Style Templates Store ============
interface StyleTemplatesState {
  templates: StyleTemplate[];
  isLoading: boolean;
  userId: string | null;
  unsubscribe: Unsubscribe | null;

  // Firestore integration
  initializeListener: (userId: string) => void;
  cleanup: () => void;

  // Actions
  addTemplate: (template: Omit<StyleTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateTemplate: (id: string, updates: Partial<StyleTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  setDefault: (platform: Platform, id: string) => Promise<void>;
  getByPlatform: (platform: Platform) => StyleTemplate[];
  getDefault: (platform: Platform) => StyleTemplate | undefined;
}

export const useStyleTemplatesStore = create<StyleTemplatesState>((set, get) => ({
  templates: [],
  isLoading: true,
  userId: null,
  unsubscribe: null,

  initializeListener: (userId: string) => {
    // Clean up existing listener
    get().cleanup();

    set({ userId, isLoading: true });

    const unsubscribe = subscribeToStyleTemplates(
      userId,
      (templates) => {
        set({ templates, isLoading: false });
      },
      (error) => {
        console.error('Style templates subscription error:', error);
        set({ isLoading: false });
      }
    );

    set({ unsubscribe });
  },

  cleanup: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null, userId: null, templates: [], isLoading: true });
    }
  },

  addTemplate: async (template) => {
    const { userId, templates } = get();
    if (!userId) return null;

    // Check if this is the first template for this platform
    const isFirstForPlatform = !templates.some((t) => t.platform === template.platform);

    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const now = new Date().toISOString();
    const tempTemplate: StyleTemplate = {
      ...template,
      id: tempId,
      isDefault: isFirstForPlatform,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      templates: [...state.templates, tempTemplate],
    }));

    try {
      const id = await firestoreAddStyleTemplate(userId, {
        ...template,
        isDefault: isFirstForPlatform,
      });
      return id;
    } catch (error) {
      // Rollback on error
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== tempId),
      }));
      console.error('Error adding style template:', error);
      return null;
    }
  },

  updateTemplate: async (id, updates) => {
    const { userId, templates } = get();
    if (!userId) return;

    // Optimistic update
    const previousTemplates = templates;
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id
          ? { ...t, ...updates, updatedAt: new Date().toISOString() }
          : t
      ),
    }));

    try {
      await firestoreUpdateStyleTemplate(userId, id, updates);
    } catch (error) {
      // Rollback on error
      set({ templates: previousTemplates });
      console.error('Error updating style template:', error);
    }
  },

  deleteTemplate: async (id) => {
    const { userId, templates } = get();
    if (!userId) return;

    const template = templates.find((t) => t.id === id);
    if (!template) return;

    // Optimistic update
    const previousTemplates = templates;
    const filtered = templates.filter((t) => t.id !== id);

    // If deleted template was default, set another as default
    let newDefault: StyleTemplate | undefined;
    if (template.isDefault) {
      newDefault = filtered.find((t) => t.platform === template.platform);
      if (newDefault) {
        newDefault = { ...newDefault, isDefault: true };
      }
    }

    set({
      templates: filtered.map((t) =>
        newDefault && t.id === newDefault.id ? newDefault : t
      ),
    });

    try {
      await firestoreDeleteStyleTemplate(userId, id);
      // If there was a new default, update it in Firestore
      if (newDefault) {
        await firestoreUpdateStyleTemplate(userId, newDefault.id, { isDefault: true });
      }
    } catch (error) {
      // Rollback on error
      set({ templates: previousTemplates });
      console.error('Error deleting style template:', error);
    }
  },

  setDefault: async (platform, id) => {
    const { userId, templates } = get();
    if (!userId) return;

    // Optimistic update
    const previousTemplates = templates;
    set((state) => ({
      templates: state.templates.map((t) => ({
        ...t,
        isDefault: t.platform === platform ? t.id === id : t.isDefault,
      })),
    }));

    try {
      await setDefaultStyleTemplate(userId, platform, id);
    } catch (error) {
      // Rollback on error
      set({ templates: previousTemplates });
      console.error('Error setting default template:', error);
    }
  },

  getByPlatform: (platform) => {
    return get().templates.filter((t) => t.platform === platform);
  },

  getDefault: (platform) => {
    return get().templates.find((t) => t.platform === platform && t.isDefault);
  },
}));

// ============ UI State Store (non-persisted) ============
interface UIState {
  selectedNewsId: string | null;
  activeTab: 'news' | 'collect';
  isModalOpen: boolean;
  setSelectedNewsId: (id: string | null) => void;
  setActiveTab: (tab: 'news' | 'collect') => void;
  setModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedNewsId: null,
  activeTab: 'news',
  isModalOpen: false,
  setSelectedNewsId: (id) => set({ selectedNewsId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setModalOpen: (open) => set({ isModalOpen: open }),
}));
