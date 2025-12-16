import { NextResponse } from 'next/server';

export function middleware(request) {
  const origin = request.headers.get('origin') || '';
	const allowedOrigins = new Set([
    'https://www.zask.kr',
    'https://api.zask.kr',
    'http://localhost:5173',
  ]);

  const response = NextResponse.next();

  if (allowedOrigins.has(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-CSRF-Token, X-Requested-With'
  );

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
