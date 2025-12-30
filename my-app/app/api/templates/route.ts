import { NextRequest, NextResponse } from 'next/server';
import {
  getStyleTemplatesByUserId,
  createStyleTemplate,
  DEFAULT_USER_ID,
  getOrCreateDefaultUser,
} from '@/lib/db/queries';
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
  await getOrCreateDefaultUser();

  const templates = await getStyleTemplatesByUserId(DEFAULT_USER_ID);
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  await getOrCreateDefaultUser();

  try {
    const body = await request.json();
    const data = templateSchema.parse(body);

    const template = await createStyleTemplate({
      ...data,
      userId: DEFAULT_USER_ID,
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
