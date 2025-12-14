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
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 콜백 URL이 상대경로면 baseUrl과 합치기
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // 같은 도메인이면 리다이렉트 허용
      else if (new URL(url).origin === baseUrl) return url;
      // 그 외는 프론트엔드 메인 페이지로
      return `https://www.zask.kr?loginSuccess=true`;
    },
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
    },
  },
});

export { handler as GET, handler as POST };