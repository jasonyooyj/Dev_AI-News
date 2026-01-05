import { NextResponse } from 'next/server';
import {
  getOrCreateDefaultUser,
  getLastReadAt,
  updateLastReadAt,
  DEFAULT_USER_ID,
} from '@/lib/db/queries';

// GET - lastReadAt 조회
export async function GET() {
  try {
    await getOrCreateDefaultUser();
    const lastReadAt = await getLastReadAt(DEFAULT_USER_ID);
    return NextResponse.json({ lastReadAt: lastReadAt?.toISOString() ?? null });
  } catch (error) {
    console.error('Error getting lastReadAt:', error);
    return NextResponse.json(
      { error: 'Failed to get last read time' },
      { status: 500 }
    );
  }
}

// POST - lastReadAt 업데이트 (모두 읽음 처리)
export async function POST() {
  try {
    await getOrCreateDefaultUser();
    const lastReadAt = await updateLastReadAt(DEFAULT_USER_ID);
    return NextResponse.json({ lastReadAt: lastReadAt.toISOString() });
  } catch (error) {
    console.error('Error updating lastReadAt:', error);
    return NextResponse.json(
      { error: 'Failed to update last read time' },
      { status: 500 }
    );
  }
}
