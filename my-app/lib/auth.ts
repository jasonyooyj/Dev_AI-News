import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { compare, hash } from 'bcryptjs';
import { db, users } from './db';
import { eq } from 'drizzle-orm';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          image: user.photoUrl,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Check if user exists, if not create one
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1);

        if (!existingUser) {
          await db.insert(users).values({
            email: user.email!,
            displayName: user.name || user.email!.split('@')[0],
            photoUrl: user.image,
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // Get user from database to ensure we have the correct ID
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1);

        if (dbUser) {
          token.id = dbUser.id;
          token.theme = dbUser.theme;
          token.autoSummarize = dbUser.autoSummarize;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.theme = token.theme as 'light' | 'dark' | 'system';
        session.user.autoSummarize = token.autoSummarize as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});

// Helper function to create a new user with credentials
export async function createUser(
  email: string,
  password: string,
  displayName?: string
) {
  const passwordHash = await hash(password, 12);

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      displayName: displayName || email.split('@')[0],
    })
    .returning();

  return newUser;
}

// Helper function to check if email exists
export async function emailExists(email: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return !!user;
}
