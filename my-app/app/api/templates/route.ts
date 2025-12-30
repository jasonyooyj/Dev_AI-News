import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStyleTemplatesByUserId, createStyleTemplate } from '@/lib/db/queries';
import { z } from 'zod';

const templateSchema = z.object({
  platform: z.enum(['twitter', 'threads', 'instagram', 'linkedin', 'bluesky']),
  name: z.string().min(1),
  examples: z.array(z.string()),
  tone: z.string().optional(),
  characteristics: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templates = await getStyleTemplatesByUserId(session.user.id);
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = templateSchema.parse(body);

    const template = await createStyleTemplate({
      ...data,
      userId: session.user.id,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
