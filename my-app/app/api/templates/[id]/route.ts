import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getStyleTemplateById,
  updateStyleTemplate,
  deleteStyleTemplate,
} from '@/lib/db/queries';
import { z } from 'zod';

const updateTemplateSchema = z.object({
  platform: z.enum(['twitter', 'threads', 'instagram', 'linkedin', 'bluesky']).optional(),
  name: z.string().min(1).optional(),
  examples: z.array(z.string()).optional(),
  tone: z.string().optional().nullable(),
  characteristics: z.array(z.string()).optional().nullable(),
  isDefault: z.boolean().optional(),
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
  const template = await getStyleTemplateById(id);

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (template.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(template);
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
  const template = await getStyleTemplateById(id);

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (template.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = updateTemplateSchema.parse(body);

    const updated = await updateStyleTemplate(id, data);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
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
  const template = await getStyleTemplateById(id);

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (template.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await deleteStyleTemplate(id);
  return NextResponse.json({ success: true });
}
