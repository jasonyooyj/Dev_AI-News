import { NextRequest, NextResponse } from 'next/server';
import {
  getNewsItemsByUserId,
  createNewsItem,
  createNewsItems,
  deleteAllNewsItems,
  DEFAULT_USER_ID,
  getOrCreateDefaultUser,
} from '@/lib/db/queries';
import { z } from 'zod';

const newsItemSchema = z.object({
  sourceId: z.string().uuid(),
  title: z.string().min(1),
  originalContent: z.string(),
  url: z.string().url(),
  publishedAt: z.string().optional(),
  isProcessed: z.boolean().optional(),
  isBookmarked: z.boolean().optional(),
  quickSummary: z
    .object({
      bullets: z.array(z.string()),
      category: z.enum(['product', 'update', 'research', 'announcement', 'other']),
      createdAt: z.string(),
    })
    .optional(),
  translatedContent: z.string().optional(),
  translatedAt: z.string().optional(),
});

export async function GET() {
  // Ensure default user exists
  await getOrCreateDefaultUser();

  const newsItems = await getNewsItemsByUserId(DEFAULT_USER_ID);
  return NextResponse.json(newsItems);
}

export async function POST(request: NextRequest) {
  // Ensure default user exists
  await getOrCreateDefaultUser();

  try {
    const body = await request.json();

    // Handle batch creation
    if (Array.isArray(body)) {
      const items = body.map((item) => ({
        ...newsItemSchema.parse(item),
        userId: DEFAULT_USER_ID,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : undefined,
        translatedAt: item.translatedAt ? new Date(item.translatedAt) : undefined,
      }));

      const created = await createNewsItems(items);
      return NextResponse.json(created, { status: 201 });
    }

    // Single item creation
    const data = newsItemSchema.parse(body);
    const newsItem = await createNewsItem({
      ...data,
      userId: DEFAULT_USER_ID,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
      translatedAt: data.translatedAt ? new Date(data.translatedAt) : undefined,
    });

    return NextResponse.json(newsItem, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating news item:', error);
    return NextResponse.json({ error: 'Failed to create news item' }, { status: 500 });
  }
}

export async function DELETE() {
  await deleteAllNewsItems(DEFAULT_USER_ID);
  return NextResponse.json({ success: true });
}
