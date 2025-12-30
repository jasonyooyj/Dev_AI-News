import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const publicRoutes = ['/login', '/signup', '/forgot-password'];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isApiRoute = nextUrl.pathname.startsWith('/api');

  // Allow API routes to pass through
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from public routes
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // Redirect non-logged-in users to login
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
