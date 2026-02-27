import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

export default async function middleware(req: NextRequest) {
  // Skip server action POST requests — requireAuth() in each action handles auth
  // Next.js server actions send a "Next-Action" header
  if (req.method === 'POST' && req.headers.get('next-action')) {
    return NextResponse.next();
  }

  // For all other matched routes, delegate to Neon Auth middleware
  const handler = auth.middleware({ loginUrl: '/auth/sign-in' });
  return handler(req);
}

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - manifest.json, sw.js, icons/ (PWA assets)
     * - api/auth (Neon Auth API handler)
     * - auth/ (auth pages themselves)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|icons/|api/auth|auth/).*)',
  ],
};
