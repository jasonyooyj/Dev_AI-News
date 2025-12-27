import { Source, NewsItem, ProcessedNews } from '@/types/news';
import { STORAGE_KEYS, DEFAULT_SOURCES } from './constants';

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const item = localStorage.getItem(key);
  if (!item) return defaultValue;
  try {
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Sources
export function getSources(): Source[] {
  const sources = getItem<Source[]>(STORAGE_KEYS.SOURCES, []);
  if (sources.length === 0) {
    setItem(STORAGE_KEYS.SOURCES, DEFAULT_SOURCES);
    return DEFAULT_SOURCES;
  }
  return sources;
}

export function saveSources(sources: Source[]): void {
  setItem(STORAGE_KEYS.SOURCES, sources);
}

export function addSource(source: Source): void {
  const sources = getSources();
  sources.push(source);
  saveSources(sources);
}

export function updateSource(id: string, updates: Partial<Source>): void {
  const sources = getSources();
  const index = sources.findIndex((s) => s.id === id);
  if (index !== -1) {
    sources[index] = { ...sources[index], ...updates };
    saveSources(sources);
  }
}

export function deleteSource(id: string): void {
  const sources = getSources().filter((s) => s.id !== id);
  saveSources(sources);
}

// News Items
export function getNewsItems(): NewsItem[] {
  return getItem<NewsItem[]>(STORAGE_KEYS.NEWS_ITEMS, []);
}

export function saveNewsItems(items: NewsItem[]): void {
  setItem(STORAGE_KEYS.NEWS_ITEMS, items);
}

export function addNewsItem(item: NewsItem): void {
  const items = getNewsItems();
  items.unshift(item);
  saveNewsItems(items);
}

export function updateNewsItem(id: string, updates: Partial<NewsItem>): void {
  const items = getNewsItems();
  const index = items.findIndex((i) => i.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    saveNewsItems(items);
  }
}

export function deleteNewsItem(id: string): void {
  const items = getNewsItems().filter((i) => i.id !== id);
  saveNewsItems(items);
}

// Processed News
export function getProcessedNews(): ProcessedNews[] {
  return getItem<ProcessedNews[]>(STORAGE_KEYS.PROCESSED_NEWS, []);
}

export function saveProcessedNews(items: ProcessedNews[]): void {
  setItem(STORAGE_KEYS.PROCESSED_NEWS, items);
}

export function addProcessedNews(item: ProcessedNews): void {
  const items = getProcessedNews();
  items.unshift(item);
  saveProcessedNews(items);
}

export function getProcessedNewsByNewsId(newsItemId: string): ProcessedNews | undefined {
  return getProcessedNews().find((p) => p.newsItemId === newsItemId);
}

export function deleteProcessedNews(id: string): void {
  const items = getProcessedNews().filter((p) => p.id !== id);
  saveProcessedNews(items);
}
