import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    theme?: 'light' | 'dark' | 'system';
    autoSummarize?: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      theme?: 'light' | 'dark' | 'system';
      autoSummarize?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    theme?: 'light' | 'dark' | 'system';
    autoSummarize?: boolean;
  }
}
