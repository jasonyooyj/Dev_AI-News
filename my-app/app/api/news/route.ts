import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getNewsItemsByUserId,
  createNewsItem,
  createNewsItems,
  deleteAllNewsItems,
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
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const newsItems = await getNewsItemsByUserId(session.user.id);
  return NextResponse.json(newsItems);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Handle batch creation
    if (Array.isArray(body)) {
      const items = body.map((item) => ({
        ...newsItemSchema.parse(item),
        userId: session.user.id,
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
      userId: session.user.id,
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
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await deleteAllNewsItems(session.user.id);
  return NextResponse.json({ success: true });
}
