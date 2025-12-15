// app/api/auth/[...nextauth]/route.js

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../../lib/prisma";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  // Ensure cookies are set for the root domain so subdomains (www/api) can share them
  cookies: {
    sessionToken: {
      name: process.env.NEXTAUTH_COOKIE_NAME || 'next-auth.session-token',
      options: {
        domain: process.env.COOKIE_DOMAIN || '.zask.kr',
        path: '/',
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      },
    },
  },
  callbacks: {
    // Redirect to the frontend site after sign in to avoid landing on API root (which 404s)
    async redirect({ url, baseUrl }) {
      const FRONTEND = process.env.NEXTAUTH_URL_FRONTEND || 'https://www.zask.kr';
      try {
        if (url && url.startsWith('/')) return `${FRONTEND}${url}`;
        const parsed = new URL(url || '');
        // If the url origin equals the API baseUrl, redirect to frontend preserving path
        if (parsed.origin === baseUrl) return `${FRONTEND}${parsed.pathname}${parsed.search}`;
      } catch (e) {
        // fallback
      }
      return FRONTEND;
    },
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});

export const authOptions = handler;

// CORS wrapper for NextAuth
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.zask.kr',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

async function corsHandler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  
  const response = await handler(req);
  const newResponse = new Response(response.body, response);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  return newResponse;
}

export const GET = corsHandler;
export const POST = corsHandler;
export const OPTIONS = async () => new Response(null, {
  status: 200,
  headers: corsHeaders,
});