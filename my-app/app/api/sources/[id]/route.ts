import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSourceById, updateSource, deleteSource } from '@/lib/db/queries';
import { z } from 'zod';

const updateSourceSchema = z.object({
  name: z.string().min(1).optional(),
  websiteUrl: z.string().url().optional(),
  rssUrl: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
  scrapeConfig: z
    .object({
      articleSelector: z.string(),
      titleSelector: z.string(),
      linkSelector: z.string(),
      descriptionSelector: z.string().optional(),
      dateSelector: z.string().optional(),
    })
    .optional()
    .nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const source = await getSourceById(id);

  if (!source) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  if (source.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(source);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const source = await getSourceById(id);

  if (!source) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  if (source.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = updateSourceSchema.parse(body);

    const updated = await updateSource(id, data);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating source:', error);
    return NextResponse.json({ error: 'Failed to update source' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const source = await getSourceById(id);

  if (!source) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  if (source.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await deleteSource(id);
  return NextResponse.json({ success: true });
}
