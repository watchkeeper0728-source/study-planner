import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

// 環境変数の検証（デバッグ用）
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  throw new Error(
    "Missing required environment variables: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET"
  );
}

// クライアントIDの一部をログ出力（デバッグ用、後で削除推奨）
// 一時的に本番環境でも出力して確認
console.log("[AUTH DEBUG] GOOGLE_CLIENT_ID starts with:", googleClientId.substring(0, 35) + "...");
console.log("[AUTH DEBUG] Expected ID should start with: 259584654504-h86ohpa6trnsif0falig3qssg55r7aap");

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
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  session: {
    strategy: "database",
  },
  secret: process.env.NEXTAUTH_SECRET!,
};

export async function auth() {
  return await getServerSession(authOptions);
}
