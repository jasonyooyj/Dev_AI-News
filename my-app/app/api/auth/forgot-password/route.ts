import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Check if user exists
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to prevent email enumeration
    // In production, you would:
    // 1. Generate a password reset token
    // 2. Store it in the database with an expiration
    // 3. Send an email with the reset link

    if (user) {
      // Generate reset token (in production, save this to DB)
      const resetToken = crypto.randomBytes(32).toString('hex');

      // TODO: Implement email sending
      // await sendPasswordResetEmail(email, resetToken);

      console.log(`Password reset requested for ${email}. Token: ${resetToken}`);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
