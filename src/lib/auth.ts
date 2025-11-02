import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

// 環境変数の明示的な読み込み
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim();
const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();

// 必須環境変数の検証
if (!googleClientId) {
  throw new Error("GOOGLE_CLIENT_ID environment variable is not set");
}
if (!googleClientSecret) {
  throw new Error("GOOGLE_CLIENT_SECRET environment variable is not set");
}
if (!nextAuthSecret) {
  throw new Error("NEXTAUTH_SECRET environment variable is not set");
}
if (!nextAuthUrl) {
  throw new Error("NEXTAUTH_URL environment variable is not set");
}

// デバッグログ
console.log("[AUTH DEBUG] ========================================");
console.log("[AUTH DEBUG] Loading NextAuth configuration...");
console.log("[AUTH DEBUG] GOOGLE_CLIENT_ID:", googleClientId.substring(0, 40) + "...");
console.log("[AUTH DEBUG] Expected starts with: 259584654504-h86ohpa6trnsif0falig3qssg55r7aap");
console.log("[AUTH DEBUG] ID Match:", googleClientId.startsWith("259584654504-h86ohpa6trnsif0falig3qssg55r7aap"));
console.log("[AUTH DEBUG] NEXTAUTH_URL:", nextAuthUrl);
console.log("[AUTH DEBUG] Expected redirect URI:", `${nextAuthUrl}/api/auth/callback/google`);
console.log("[AUTH DEBUG] ========================================");

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar",
          prompt: "consent",
          access_type: "offline",
        },
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // リダイレクトURIの確認
      console.log("[AUTH DEBUG] Redirect callback - url:", url, "baseUrl:", baseUrl);
      // カスタムリダイレクトURLがある場合はそれを使用
      if (url.startsWith(baseUrl)) return url;
      // デフォルトはトップページにリダイレクト
      return baseUrl;
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ account, profile }) {
      // サインイン時のデバッグ情報
      console.log("[AUTH DEBUG] SignIn callback triggered");
      if (account) {
        console.log("[AUTH DEBUG] Provider:", account.provider);
        console.log("[AUTH DEBUG] Using Client ID:", googleClientId.substring(0, 40) + "...");
      }
      return true;
    },
  },
  session: {
    strategy: "database",
  },
  secret: nextAuthSecret,
  debug: true, // デバッグモードを有効化
};

export async function auth() {
  return await getServerSession(authOptions);
}
