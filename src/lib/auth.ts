import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "online",
        },
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // カスタムリダイレクトURLがある場合はそれを使用
      if (url.startsWith(baseUrl)) return url;
      // デフォルトはトップページにリダイレクト
      return baseUrl;
    },
    async session({ session, token }) {
      // JWTストラテジー使用時はtokenを使用
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // 初回ログイン時
      if (user) {
        token.id = user.id;
      }
      // Googleログイン時
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
};