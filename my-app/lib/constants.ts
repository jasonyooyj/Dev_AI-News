import { Source } from '@/types/news';
import { v4 as uuidv4 } from 'uuid';

export const DEFAULT_SOURCES: Source[] = [
  {
    id: uuidv4(),
    name: 'OpenAI Blog',
    description: 'ChatGPT, GPT-4, DALL-E 등 OpenAI의 최신 AI 연구 및 제품 소식',
    rssUrl: 'https://openai.com/blog/rss.xml',
    websiteUrl: 'https://openai.com/blog',
    isActive: true,
  },
  {
    id: uuidv4(),
    name: 'Anthropic News',
    description: 'Claude AI를 만든 Anthropic의 AI 안전성 연구 및 기업 소식',
    websiteUrl: 'https://www.anthropic.com/news',
    isActive: true,
    scrapeConfig: {
      articleSelector: 'a[href*="/news/"]',
      titleSelector: 'h3, .title, span',
      linkSelector: 'a[href]',
      descriptionSelector: 'p',
    },
  },
  {
    id: uuidv4(),
    name: 'Google AI Blog',
    description: 'Gemini, Bard 등 Google의 AI 기술 개발 및 연구 동향',
    rssUrl: 'https://blog.google/technology/ai/rss/',
    websiteUrl: 'https://blog.google/technology/ai/',
    isActive: true,
  },
  {
    id: uuidv4(),
    name: 'Meta AI Blog',
    description: 'LLaMA, SAM 등 Meta의 오픈소스 AI 연구 및 메타버스 기술',
    websiteUrl: 'https://ai.meta.com/blog/',
    isActive: true,
    scrapeConfig: {
      articleSelector: 'article, .blog-post, a[href*="/blog/"]',
      titleSelector: 'h2, h3, .title',
      linkSelector: 'a[href]',
      descriptionSelector: 'p, .excerpt',
    },
  },
  {
    id: uuidv4(),
    name: 'Hugging Face Blog',
    description: '오픈소스 ML 커뮤니티의 최신 모델, 데이터셋, 라이브러리 소식',
    rssUrl: 'https://huggingface.co/blog/feed.xml',
    websiteUrl: 'https://huggingface.co/blog',
    isActive: true,
  },
];

export const STORAGE_KEYS = {
  SOURCES: 'ai-news-sources',
  NEWS_ITEMS: 'ai-news-items',
  PROCESSED_NEWS: 'ai-news-processed',
  STYLE_TEMPLATES: 'ai-news-style-templates',
} as const;
