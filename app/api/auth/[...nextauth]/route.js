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
  pages: {
    signIn: '/api/auth/signin',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 상대경로 처리
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // 같은 도메인 처리
      else if (new URL(url).origin === baseUrl) return url;
      // 프론트엔드로 리다이렉트
      return `https://www.zask.kr`;
    },
    async session({ session, user }) {
      // 프론트엔드에서 user.id를 사용할 수 있도록 추가
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };