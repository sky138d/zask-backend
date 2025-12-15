import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();

  // CORS headers for auth endpoints
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', 'https://www.zask.kr');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-CSRF-Token, X-Requested-With'
    );
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
