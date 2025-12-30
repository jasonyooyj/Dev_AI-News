import { NextRequest, NextResponse } from 'next/server';
import {
  getSourcesByUserId,
  createSource,
  DEFAULT_USER_ID,
  getOrCreateDefaultUser,
} from '@/lib/db/queries';
import { z } from 'zod';

const sourceSchema = z.object({
  name: z.string().min(1),
  websiteUrl: z.string().url(),
  rssUrl: z.string().url().optional(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  type: z.enum(['rss', 'youtube', 'twitter', 'threads', 'blog']).default('rss'),
  scrapeConfig: z
    .object({
      articleSelector: z.string(),
      titleSelector: z.string(),
      linkSelector: z.string(),
      descriptionSelector: z.string().optional(),
      dateSelector: z.string().optional(),
    })
    .optional(),
});

export async function GET() {
  await getOrCreateDefaultUser();

  const sources = await getSourcesByUserId(DEFAULT_USER_ID);
  return NextResponse.json(sources);
}

export async function POST(request: NextRequest) {
  await getOrCreateDefaultUser();

  try {
    const body = await request.json();
    const data = sourceSchema.parse(body);

    const source = await createSource({
      ...data,
      userId: DEFAULT_USER_ID,
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating source:', error);
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 });
  }
}
