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

// 本番環境ではデバッグログを無効化
const isDebugMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_AUTH_DEBUG === 'true';

if (isDebugMode) {
  console.log("[AUTH DEBUG] ========================================");
  console.log("[AUTH DEBUG] Loading NextAuth configuration...");
  console.log("[AUTH DEBUG] GOOGLE_CLIENT_ID:", googleClientId.substring(0, 40) + "...");
  console.log("[AUTH DEBUG] NEXTAUTH_URL:", nextAuthUrl);
  console.log("[AUTH DEBUG] Expected redirect URI:", `${nextAuthUrl}/api/auth/callback/google`);
  console.log("[AUTH DEBUG] ========================================");
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
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
      if (isDebugMode) {
        console.log("[AUTH DEBUG] Redirect callback - url:", url, "baseUrl:", baseUrl);
      }
      // カスタムリダイレクトURLがある場合はそれを使用
      if (url.startsWith(baseUrl)) {
        if (isDebugMode) {
          console.log("[AUTH DEBUG] Redirecting to custom URL:", url);
        }
        return url;
      }
      // デフォルトはトップページにリダイレクト
      if (isDebugMode) {
        console.log("[AUTH DEBUG] Redirecting to baseUrl:", baseUrl);
      }
      return baseUrl;
    },
    async session({ session, user }) {
      if (isDebugMode) {
        console.log("[AUTH DEBUG] Session callback - session exists:", !!session, "user exists:", !!user);
        console.log("[AUTH DEBUG] Session user email:", session?.user?.email);
        console.log("[AUTH DEBUG] User id:", user?.id);
      }
      if (session.user && user) {
        session.user.id = user.id;
        if (isDebugMode) {
          console.log("[AUTH DEBUG] Session user ID set to:", user.id);
        }
      } else {
        if (isDebugMode) {
          console.error("[AUTH DEBUG] WARNING: Session or user is missing!");
        }
      }
      return session;
    },
    async signIn({ account, profile, user }) {
      if (isDebugMode) {
        console.log("[AUTH DEBUG] ========== SignIn callback triggered ==========");
        console.log("[AUTH DEBUG] User exists:", !!user);
        console.log("[AUTH DEBUG] User email:", user?.email || "NO USER");
        console.log("[AUTH DEBUG] User id:", user?.id || "NO USER ID");
        console.log("[AUTH DEBUG] Profile email:", profile?.email || "NO PROFILE");
        console.log("[AUTH DEBUG] Account provider:", account?.provider || "NO ACCOUNT");
        console.log("[AUTH DEBUG] ==============================================");
      }
      // 本番環境ではすべてのユーザーを許可
      return true;
    },
  },
  session: {
    strategy: "database",
  },
  secret: nextAuthSecret,
  debug: isDebugMode, // デバッグモードは開発環境のみ
  events: {
    async signIn({ user, account, profile }) {
      if (isDebugMode) {
        console.log("[AUTH DEBUG] ========== Event: signIn ==========");
        console.log("[AUTH DEBUG] User:", user?.email || "NO USER");
        console.log("[AUTH DEBUG] Account provider:", account?.provider || "NO ACCOUNT");
        console.log("[AUTH DEBUG] Profile email:", profile?.email || "NO PROFILE");
        console.log("[AUTH DEBUG] =====================================");
      }
    },
    async createUser({ user }) {
      if (isDebugMode) {
        console.log("[AUTH DEBUG] ========== Event: createUser ==========");
        console.log("[AUTH DEBUG] New user created:", user?.email || "NO USER");
        console.log("[AUTH DEBUG] User ID:", user?.id || "NO ID");
        console.log("[AUTH DEBUG] ========================================");
      }
    },
    async linkAccount({ account, user }) {
      if (isDebugMode) {
        console.log("[AUTH DEBUG] ========== Event: linkAccount ==========");
        console.log("[AUTH DEBUG] Account linked for user:", user?.email || "NO USER");
        console.log("[AUTH DEBUG] Account provider:", account?.provider || "NO ACCOUNT");
        console.log("[AUTH DEBUG] Provider account ID:", account?.providerAccountId || "NO ID");
        console.log("[AUTH DEBUG] =========================================");
      }
    },
    async createSession({ session, user }) {
      if (isDebugMode) {
        console.log("[AUTH DEBUG] ========== Event: createSession ==========");
        console.log("[AUTH DEBUG] Session created for user:", user?.email || "NO USER");
        console.log("[AUTH DEBUG] Session token:", session?.sessionToken?.substring(0, 20) + "..." || "NO TOKEN");
        console.log("[AUTH DEBUG] ===========================================");
      }
    },
  },
};

export async function auth() {
  return await getServerSession(authOptions);
}
