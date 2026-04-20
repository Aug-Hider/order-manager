import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Rate limiting désactivé en dev local
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/kitchen/:path*'],
};