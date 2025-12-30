import { NextRequest, NextResponse } from 'next/server';
import { getNewsItemById, updateNewsItem, deleteNewsItem } from '@/lib/db/queries';
import { z } from 'zod';

const updateNewsItemSchema = z.object({
  title: z.string().min(1).optional(),
  originalContent: z.string().optional(),
  url: z.string().url().optional(),
  publishedAt: z.string().optional().nullable(),
  isProcessed: z.boolean().optional(),
  isBookmarked: z.boolean().optional(),
  quickSummary: z
    .object({
      bullets: z.array(z.string()),
      category: z.enum(['product', 'update', 'research', 'announcement', 'other']),
      createdAt: z.string(),
    })
    .optional()
    .nullable(),
  translatedContent: z.string().optional().nullable(),
  translatedAt: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const newsItem = await getNewsItemById(id);

  if (!newsItem) {
    return NextResponse.json({ error: 'News item not found' }, { status: 404 });
  }

  return NextResponse.json(newsItem);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const newsItem = await getNewsItemById(id);

  if (!newsItem) {
    return NextResponse.json({ error: 'News item not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data = updateNewsItemSchema.parse(body);

    const updated = await updateNewsItem(id, {
      ...data,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
      translatedAt: data.translatedAt ? new Date(data.translatedAt) : undefined,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating news item:', error);
    return NextResponse.json({ error: 'Failed to update news item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const newsItem = await getNewsItemById(id);

  if (!newsItem) {
    return NextResponse.json({ error: 'News item not found' }, { status: 404 });
  }

  await deleteNewsItem(id);
  return NextResponse.json({ success: true });
}
