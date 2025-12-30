import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSocialConnectionsByUserId, upsertSocialConnection, deleteSocialConnection } from '@/lib/db/queries';
import { z } from 'zod';

const connectionSchema = z.object({
  platform: z.enum(['twitter', 'threads', 'instagram', 'linkedin', 'bluesky']),
  handle: z.string(),
  isConnected: z.boolean().optional(),
  credentials: z
    .object({
      identifier: z.string().optional(),
      appPassword: z.string().optional(),
      accessToken: z.string().optional(),
      refreshToken: z.string().optional(),
      expiresAt: z.string().optional(),
    })
    .optional(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connections = await getSocialConnectionsByUserId(session.user.id);
  return NextResponse.json(connections);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = connectionSchema.parse(body);

    const connection = await upsertSocialConnection({
      ...data,
      userId: session.user.id,
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating social connection:', error);
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
  }
}
