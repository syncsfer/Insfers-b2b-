import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

/**
 * Routes that must stay reachable without a session.
 *
 * Everything a customer touches is public — they pay, view an invoice, claim a
 * refund, or read a receipt without ever having an account. Only the merchant
 * dashboard and the data APIs behind it require login.
 */
const PUBLIC_PREFIXES = [
  '/auth',            // Auth0 SDK routes (login, logout, callback, profile)
  '/login',
  '/signup',
  '/forgot-password',
  '/checkout',        // customer checkout
  '/i',               // public invoice
  '/l',               // payment link
  '/r',               // public receipt
  '/claim',           // refund claim
  '/security',
  '/how-it-works',
];

function isPublic(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const authRes = await auth0.middleware(request);
  const { pathname, origin } = request.nextUrl;

  // Let the SDK own its own routes.
  if (pathname.startsWith('/auth')) {
    return authRes;
  }

  if (isPublic(pathname)) {
    return authRes;
  }

  const session = await auth0.getSession(request);

  if (!session) {
    // APIs get a 401 rather than an HTML redirect so callers can handle it.
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const returnTo = encodeURIComponent(pathname + request.nextUrl.search);
    return NextResponse.redirect(`${origin}/auth/login?returnTo=${returnTo}`);
  }

  return authRes;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
