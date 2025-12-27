import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Source, NewsItem, StyleTemplate, Platform, QuickSummary } from '@/types/news';
import { DEFAULT_SOURCES, STORAGE_KEYS } from '@/lib/constants';

// ============ News Store ============
interface NewsState {
  newsItems: NewsItem[];
  isLoading: boolean;
  addNewsItem: (item: Omit<NewsItem, 'id' | 'createdAt'>) => void;
  updateNewsItem: (id: string, updates: Partial<NewsItem>) => void;
  deleteNewsItem: (id: string) => void;
  setNewsItems: (items: NewsItem[]) => void;
  addSummary: (id: string, summary: QuickSummary) => void;
  toggleBookmark: (id: string) => void;
}

export const useNewsStore = create<NewsState>()(
  persist(
    (set, get) => ({
      newsItems: [],
      isLoading: false,

      addNewsItem: (item) => {
        const newItem: NewsItem = {
          ...item,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          newsItems: [newItem, ...state.newsItems],
        }));
      },

      updateNewsItem: (id, updates) => {
        set((state) => ({
          newsItems: state.newsItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      deleteNewsItem: (id) => {
        set((state) => ({
          newsItems: state.newsItems.filter((item) => item.id !== id),
        }));
      },

      setNewsItems: (items) => {
        set({ newsItems: items });
      },

      addSummary: (id, summary) => {
        set((state) => ({
          newsItems: state.newsItems.map((item) =>
            item.id === id ? { ...item, quickSummary: summary } : item
          ),
        }));
      },

      toggleBookmark: (id) => {
        set((state) => ({
          newsItems: state.newsItems.map((item) =>
            item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
          ),
        }));
      },
    }),
    {
      name: STORAGE_KEYS.NEWS_ITEMS,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ============ Sources Store ============
interface SourcesState {
  sources: Source[];
  isLoading: boolean;
  addSource: (source: Omit<Source, 'id'>) => void;
  updateSource: (id: string, updates: Partial<Source>) => void;
  deleteSource: (id: string) => void;
  setSources: (sources: Source[]) => void;
  initDefaults: () => void;
}

export const useSourcesStore = create<SourcesState>()(
  persist(
    (set, get) => ({
      sources: [],
      isLoading: false,

      addSource: (source) => {
        const newSource: Source = {
          ...source,
          id: crypto.randomUUID(),
        };
        set((state) => ({
          sources: [...state.sources, newSource],
        }));
      },

      updateSource: (id, updates) => {
        set((state) => ({
          sources: state.sources.map((source) =>
            source.id === id ? { ...source, ...updates } : source
          ),
        }));
      },

      deleteSource: (id) => {
        set((state) => ({
          sources: state.sources.filter((source) => source.id !== id),
        }));
      },

      setSources: (sources) => {
        set({ sources });
      },

      initDefaults: () => {
        const { sources } = get();
        if (sources.length === 0) {
          set({ sources: DEFAULT_SOURCES });
        }
      },
    }),
    {
      name: STORAGE_KEYS.SOURCES,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Initialize defaults after hydration
        if (state && state.sources.length === 0) {
          state.initDefaults();
        }
      },
    }
  )
);

// ============ Style Templates Store ============
interface StyleTemplatesState {
  templates: StyleTemplate[];
  isLoading: boolean;
  addTemplate: (template: Omit<StyleTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTemplate: (id: string, updates: Partial<StyleTemplate>) => void;
  deleteTemplate: (id: string) => void;
  setDefault: (platform: Platform, id: string) => void;
  getByPlatform: (platform: Platform) => StyleTemplate[];
  getDefault: (platform: Platform) => StyleTemplate | undefined;
}

export const useStyleTemplatesStore = create<StyleTemplatesState>()(
  persist(
    (set, get) => ({
      templates: [],
      isLoading: false,

      addTemplate: (template) => {
        const now = new Date().toISOString();
        const templates = get().templates;
        const isFirstForPlatform = !templates.some((t) => t.platform === template.platform);

        const newTemplate: StyleTemplate = {
          ...template,
          id: crypto.randomUUID(),
          isDefault: isFirstForPlatform,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        const templates = get().templates;
        const template = templates.find((t) => t.id === id);
        if (!template) return;

        const filtered = templates.filter((t) => t.id !== id);

        // If deleted template was default, set another as default
        if (template.isDefault) {
          const samePlatform = filtered.find((t) => t.platform === template.platform);
          if (samePlatform) {
            samePlatform.isDefault = true;
          }
        }

        set({ templates: filtered });
      },

      setDefault: (platform, id) => {
        set((state) => ({
          templates: state.templates.map((t) => ({
            ...t,
            isDefault: t.platform === platform ? t.id === id : t.isDefault,
          })),
        }));
      },

      getByPlatform: (platform) => {
        return get().templates.filter((t) => t.platform === platform);
      },

      getDefault: (platform) => {
        return get().templates.find((t) => t.platform === platform && t.isDefault);
      },
    }),
    {
      name: STORAGE_KEYS.STYLE_TEMPLATES,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

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
