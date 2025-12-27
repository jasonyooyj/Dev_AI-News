export interface Source {
  id: string;
  name: string;
  rssUrl?: string;
  websiteUrl: string;
  isActive: boolean;
  lastFetchedAt?: string;
}

export interface NewsItem {
  id: string;
  sourceId: string;
  title: string;
  originalContent: string;
  url: string;
  publishedAt?: string;
  isProcessed: boolean;
  createdAt: string;
}

export interface PlatformContent {
  content: string;
  charCount?: number;
  hashtags?: string[];
}

export interface ProcessedNews {
  id: string;
  newsItemId: string;
  summary: string;
  platforms: {
    twitter?: PlatformContent;
    threads?: PlatformContent;
    instagram?: PlatformContent;
    linkedin?: PlatformContent;
  };
  createdAt: string;
}

export type Platform = 'twitter' | 'threads' | 'instagram' | 'linkedin';

export interface PlatformConfig {
  name: string;
  icon: string;
  maxLength?: number;
  color: string;
}

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  twitter: {
    name: 'X (Twitter)',
    icon: 'X',
    maxLength: 280,
    color: '#000000',
  },
  threads: {
    name: 'Threads',
    icon: 'Threads',
    maxLength: 500,
    color: '#000000',
  },
  instagram: {
    name: 'Instagram',
    icon: 'Instagram',
    maxLength: 2200,
    color: '#E4405F',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'LinkedIn',
    maxLength: 3000,
    color: '#0A66C2',
  },
};
