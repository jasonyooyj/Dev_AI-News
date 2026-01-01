import { create } from 'zustand';
import { Source, NewsItem, StyleTemplate, Platform, QuickSummary, PlatformContent } from '@/types/news';
import { DEFAULT_SOURCES } from '@/lib/constants';

// API helper functions
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ============ News Store ============
interface NewsState {
  newsItems: NewsItem[];
  isLoading: boolean;
  isInitialized: boolean;

  // Data fetching
  fetchNews: () => Promise<void>;

  // Actions
  addNewsItem: (item: Omit<NewsItem, 'id' | 'createdAt'>) => Promise<string | null>;
  addNewsItems: (items: Omit<NewsItem, 'id' | 'createdAt'>[]) => Promise<void>;
  updateNewsItem: (id: string, updates: Partial<NewsItem>) => Promise<void>;
  deleteNewsItem: (id: string) => Promise<void>;
  deleteAllNewsItems: () => Promise<void>;
  setNewsItems: (items: NewsItem[]) => void;
  addSummary: (id: string, summary: QuickSummary) => Promise<void>;
  toggleBookmark: (id: string) => Promise<void>;
  saveTranslation: (id: string, translatedContent: string) => Promise<void>;
  saveGeneratedContent: (id: string, platform: Platform, content: PlatformContent) => Promise<void>;
  reset: () => void;
}

export const useNewsStore = create<NewsState>((set, get) => ({
  newsItems: [],
  isLoading: false,
  isInitialized: false,

  fetchNews: async () => {
    if (get().isLoading) return;

    set({ isLoading: true });

    try {
      const items = await fetchApi<NewsItem[]>('/api/news');
      // Convert date strings back to proper format
      const formattedItems = items.map((item) => ({
        ...item,
        createdAt: item.createdAt,
        publishedAt: item.publishedAt || undefined,
        translatedAt: item.translatedAt || undefined,
      }));
      set({ newsItems: formattedItems, isInitialized: true });
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addNewsItem: async (item) => {
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
      const created = await fetchApi<NewsItem>('/api/news', {
        method: 'POST',
        body: JSON.stringify(item),
      });

      // Replace temp item with real item
      set((state) => ({
        newsItems: state.newsItems.map((n) => (n.id === tempId ? created : n)),
      }));

      return created.id;
    } catch (error) {
      // Rollback on error
      set((state) => ({
        newsItems: state.newsItems.filter((n) => n.id !== tempId),
      }));
      console.error('Error adding news item:', error);
      return null;
    }
  },

  addNewsItems: async (items) => {
    if (items.length === 0) return;

    try {
      const created = await fetchApi<NewsItem[]>('/api/news', {
        method: 'POST',
        body: JSON.stringify(items),
      });

      set((state) => ({
        newsItems: [...created, ...state.newsItems],
      }));
    } catch (error) {
      console.error('Error adding news items:', error);
    }
  },

  updateNewsItem: async (id, updates) => {
    // Skip API call for temp items (not yet saved to DB)
    if (id.startsWith('temp_')) {
      console.warn('Skipping update for temp item:', id);
      return;
    }

    const { newsItems } = get();

    // Optimistic update
    const previousItems = newsItems;
    set((state) => ({
      newsItems: state.newsItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));

    try {
      await fetchApi(`/api/news/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      // Rollback on error
      set({ newsItems: previousItems });
      console.error('Error updating news item:', error);
    }
  },

  deleteNewsItem: async (id) => {
    // Skip API call for temp items (not yet saved to DB)
    if (id.startsWith('temp_')) {
      set((state) => ({
        newsItems: state.newsItems.filter((item) => item.id !== id),
      }));
      return;
    }

    const { newsItems } = get();

    // Optimistic update
    const previousItems = newsItems;
    set((state) => ({
      newsItems: state.newsItems.filter((item) => item.id !== id),
    }));

    try {
      await fetchApi(`/api/news/${id}`, { method: 'DELETE' });
    } catch (error) {
      // Rollback on error
      set({ newsItems: previousItems });
      console.error('Error deleting news item:', error);
    }
  },

  deleteAllNewsItems: async () => {
    const { newsItems } = get();

    // Optimistic update
    const previousItems = newsItems;
    set({ newsItems: [] });

    try {
      await fetchApi('/api/news', { method: 'DELETE' });
    } catch (error) {
      // Rollback on error
      set({ newsItems: previousItems });
      console.error('Error deleting all news items:', error);
    }
  },

  setNewsItems: (items) => {
    set({ newsItems: items });
  },

  addSummary: async (id, summary) => {
    await get().updateNewsItem(id, { quickSummary: summary, isProcessed: true });
  },

  toggleBookmark: async (id) => {
    const item = get().newsItems.find((n) => n.id === id);
    if (!item) return;

    await get().updateNewsItem(id, { isBookmarked: !item.isBookmarked });
  },

  saveTranslation: async (id, translatedContent) => {
    await get().updateNewsItem(id, {
      translatedContent,
      translatedAt: new Date().toISOString(),
    });
  },

  saveGeneratedContent: async (id, platform, content) => {
    const item = get().newsItems.find((n) => n.id === id);
    if (!item) return;

    const updatedContents = {
      ...(item.generatedContents || {}),
      [platform]: content,
    };

    await get().updateNewsItem(id, {
      generatedContents: updatedContents,
    });
  },

  reset: () => {
    set({ newsItems: [], isLoading: false, isInitialized: false });
  },
}));

// ============ Sources Store ============
interface SourcesState {
  sources: Source[];
  isLoading: boolean;
  isInitialized: boolean;

  // Data fetching
  fetchSources: () => Promise<void>;

  // Actions
  addSource: (source: Omit<Source, 'id'>) => Promise<string | null>;
  updateSource: (id: string, updates: Partial<Source>) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;
  setSources: (sources: Source[]) => void;
  initDefaults: () => Promise<void>;
  removeDuplicates: () => Promise<void>;
  reset: () => void;
}

export const useSourcesStore = create<SourcesState>((set, get) => ({
  sources: [],
  isLoading: false,
  isInitialized: false,

  fetchSources: async () => {
    if (get().isLoading) return;

    set({ isLoading: true });

    try {
      const sources = await fetchApi<Source[]>('/api/sources');
      set({ sources, isInitialized: true });

      // Initialize defaults if no sources exist
      if (sources.length === 0) {
        get().initDefaults();
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addSource: async (source) => {
    const { sources } = get();

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
      const created = await fetchApi<Source>('/api/sources', {
        method: 'POST',
        body: JSON.stringify(source),
      });

      // Replace temp with real
      set((state) => ({
        sources: state.sources.map((s) => (s.id === tempId ? created : s)),
      }));

      return created.id;
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
    const { sources } = get();

    // Optimistic update
    const previousSources = sources;
    set((state) => ({
      sources: state.sources.map((source) =>
        source.id === id ? { ...source, ...updates } : source
      ),
    }));

    try {
      await fetchApi(`/api/sources/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      // Rollback on error
      set({ sources: previousSources });
      console.error('Error updating source:', error);
    }
  },

  deleteSource: async (id) => {
    const { sources } = get();

    // Optimistic update
    const previousSources = sources;
    set((state) => ({
      sources: state.sources.filter((source) => source.id !== id),
    }));

    try {
      await fetchApi(`/api/sources/${id}`, { method: 'DELETE' });
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
    const { sources } = get();

    try {
      // Get existing source URLs to avoid duplicates
      const existingUrls = new Set(
        sources.map((s) => s.websiteUrl.toLowerCase())
      );

      // Filter out sources that already exist
      const newSources = DEFAULT_SOURCES.filter(
        (s) => !existingUrls.has(s.websiteUrl.toLowerCase())
      );

      // Add each source
      for (const source of newSources) {
        const { id, ...sourceData } = source;
        await get().addSource(sourceData);
      }
    } catch (error) {
      console.error('Error initializing default sources:', error);
    }
  },

  removeDuplicates: async () => {
    const { sources, deleteSource } = get();

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
      await deleteSource(id);
    }
  },

  reset: () => {
    set({ sources: [], isLoading: false, isInitialized: false });
  },
}));

// ============ Style Templates Store ============
interface StyleTemplatesState {
  templates: StyleTemplate[];
  isLoading: boolean;
  isInitialized: boolean;

  // Data fetching
  fetchTemplates: () => Promise<void>;

  // Actions
  addTemplate: (template: Omit<StyleTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateTemplate: (id: string, updates: Partial<StyleTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  setDefault: (platform: Platform, id: string) => Promise<void>;
  getByPlatform: (platform: Platform) => StyleTemplate[];
  getDefault: (platform: Platform) => StyleTemplate | undefined;
  reset: () => void;
}

export const useStyleTemplatesStore = create<StyleTemplatesState>((set, get) => ({
  templates: [],
  isLoading: false,
  isInitialized: false,

  fetchTemplates: async () => {
    if (get().isLoading) return;

    set({ isLoading: true });

    try {
      const templates = await fetchApi<StyleTemplate[]>('/api/templates');
      set({ templates, isInitialized: true });
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addTemplate: async (template) => {
    const { templates } = get();

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
      const created = await fetchApi<StyleTemplate>('/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          ...template,
          isDefault: isFirstForPlatform,
        }),
      });

      // Replace temp with real
      set((state) => ({
        templates: state.templates.map((t) => (t.id === tempId ? created : t)),
      }));

      return created.id;
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
    const { templates } = get();

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
      await fetchApi(`/api/templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      // Rollback on error
      set({ templates: previousTemplates });
      console.error('Error updating style template:', error);
    }
  },

  deleteTemplate: async (id) => {
    const { templates } = get();

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
      await fetchApi(`/api/templates/${id}`, { method: 'DELETE' });
      // If there was a new default, update it
      if (newDefault) {
        await fetchApi(`/api/templates/${newDefault.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isDefault: true }),
        });
      }
    } catch (error) {
      // Rollback on error
      set({ templates: previousTemplates });
      console.error('Error deleting style template:', error);
    }
  },

  setDefault: async (platform, id) => {
    const { templates } = get();

    // Optimistic update
    const previousTemplates = templates;
    set((state) => ({
      templates: state.templates.map((t) => ({
        ...t,
        isDefault: t.platform === platform ? t.id === id : t.isDefault,
      })),
    }));

    try {
      // Update old default to false
      const oldDefault = previousTemplates.find(
        (t) => t.platform === platform && t.isDefault && t.id !== id
      );
      if (oldDefault) {
        await fetchApi(`/api/templates/${oldDefault.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isDefault: false }),
        });
      }

      // Update new default to true
      await fetchApi(`/api/templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isDefault: true }),
      });
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

  reset: () => {
    set({ templates: [], isLoading: false, isInitialized: false });
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
