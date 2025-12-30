import { z } from 'zod';
import { Platform } from '@/types/news';

// URL validation helper
const urlSchema = z.string().url('Please enter a valid URL');
const optionalUrlSchema = z.string().url('Please enter a valid URL').optional().or(z.literal(''));

// ============ Source Form ============
export const sourceTypeEnum = z.enum(['rss', 'youtube', 'twitter', 'threads', 'blog']);
export type SourceTypeValue = z.infer<typeof sourceTypeEnum>;

// URL 패턴 검증
const youtubeUrlPattern = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/;
const twitterUrlPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/;
const threadsUrlPattern = /^https?:\/\/(www\.)?threads\.net\/.+/;

export const sourceFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z
    .string()
    .max(200, 'Description must be less than 200 characters')
    .optional(),
  type: sourceTypeEnum,
  websiteUrl: urlSchema,
  rssUrl: z.string().optional(),
  isActive: z.boolean(),
}).refine((data) => {
  // 타입별 URL 패턴 검증
  if (data.type === 'youtube' && !youtubeUrlPattern.test(data.websiteUrl)) {
    return false;
  }
  if (data.type === 'twitter' && !twitterUrlPattern.test(data.websiteUrl)) {
    return false;
  }
  if (data.type === 'threads' && !threadsUrlPattern.test(data.websiteUrl)) {
    return false;
  }
  return true;
}, {
  message: 'URL must match the selected source type',
  path: ['websiteUrl'],
});

export type SourceFormData = z.infer<typeof sourceFormSchema>;

// ============ Style Template Form ============
export const styleTemplateFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  platform: z.enum(['twitter', 'threads', 'instagram', 'linkedin'] as const),
  tone: z.string().min(1, 'Tone is required'),
  characteristics: z.array(z.string()).min(1, 'At least one characteristic is required'),
  examples: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
});

export type StyleTemplateFormData = z.infer<typeof styleTemplateFormSchema>;

// ============ URL Scrape Form ============
export const scrapeUrlFormSchema = z.object({
  url: urlSchema,
});

export type ScrapeUrlFormData = z.infer<typeof scrapeUrlFormSchema>;

// ============ Feedback Form ============
export const feedbackFormSchema = z.object({
  feedback: z
    .string()
    .min(1, 'Feedback is required')
    .max(500, 'Feedback must be less than 500 characters'),
});

export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

// ============ Validation Helpers ============
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateSourceForm(data: unknown): SourceFormData {
  return sourceFormSchema.parse(data);
}

export function validateStyleTemplateForm(data: unknown): StyleTemplateFormData {
  return styleTemplateFormSchema.parse(data);
}
