// app/api/auth/[...nextauth]/route.js

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../../lib/prisma"; // 방금 만든 lib/prisma.js 불러오기

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  adapter: PrismaAdapter(prisma), // 로그인하면 자동으로 DB에 유저 저장됨
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/api/auth/signin',
    callback: '/api/auth/callback',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 프론트엔드로 리다이렉트
      if (url.startsWith('http://localhost') || url.startsWith('https://www.zask.kr') || url.startsWith('https://zask.kr')) {
        return url;
      }
      // loginSuccess 파라미터와 함께 프론트엔드로 돌아가기
      return `${process.env.NEXTAUTH_URL_FRONTNED || 'https://www.zask.kr'}?loginSuccess=true`;
    },
    async session({ session, user }) {
      // 프론트엔드에서 user.id(DB의 고유 ID)를 쓸 수 있게 넣어줌
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };