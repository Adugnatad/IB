import { NextResponse, type NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
  // Auth is handled client-side via Redux + tokenManager (see AuthGate / (Mainbody) layout).
  // We intentionally avoid NextAuth `withAuth` here to prevent redirect loops like:
  // "/?callbackUrl=%2Fdashboard" when no NextAuth session cookie exists.
  return NextResponse.next();
}

export const config = {
  // Run for all routes, but skip static/assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets).*)'],
};

