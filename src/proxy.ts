import { NextResponse, type NextRequest } from 'next/server';

export default function middleware(_req: NextRequest) {
  // Auth is handled client-side via Redux + tokenManager (AuthGate / (Mainbody) layout).
  // Using NextAuth `withAuth` here causes redirect loops like:
  // "/?callbackUrl=%2Fdashboard" because no NextAuth session cookie exists after our custom login.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets).*)'],
};
