import { Source } from '@/types/news';
import { v4 as uuidv4 } from 'uuid';

export const DEFAULT_SOURCES: Source[] = [
  {
    id: uuidv4(),
    name: 'OpenAI Blog',
    rssUrl: 'https://openai.com/blog/rss.xml',
    websiteUrl: 'https://openai.com/blog',
    isActive: true,
  },
  {
    id: uuidv4(),
    name: 'Anthropic News',
    websiteUrl: 'https://anthropic.com/news',
    isActive: true,
  },
  {
    id: uuidv4(),
    name: 'Google AI Blog',
    rssUrl: 'https://blog.google/technology/ai/rss/',
    websiteUrl: 'https://blog.google/technology/ai/',
    isActive: true,
  },
  {
    id: uuidv4(),
    name: 'Meta AI Blog',
    websiteUrl: 'https://ai.meta.com/blog/',
    isActive: true,
  },
  {
    id: uuidv4(),
    name: 'Hugging Face Blog',
    rssUrl: 'https://huggingface.co/blog/feed.xml',
    websiteUrl: 'https://huggingface.co/blog',
    isActive: true,
  },
];

export const STORAGE_KEYS = {
  SOURCES: 'ai-news-sources',
  NEWS_ITEMS: 'ai-news-items',
  PROCESSED_NEWS: 'ai-news-processed',
} as const;
