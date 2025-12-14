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
    // Use default redirect behavior (don't force custom redirects here)
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };