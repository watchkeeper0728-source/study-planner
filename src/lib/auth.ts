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

// PrismaAdapterをラップしてエラーをログに記録
const baseAdapter = PrismaAdapter(prisma);

// アダプターの各メソッドをラップしてエラーをキャッチ
const wrappedAdapter = {
  ...baseAdapter,
  async createUser(user: any) {
    try {
      console.log("[AUTH DEBUG] Adapter createUser called with:", user?.email);
      if (!baseAdapter.createUser) throw new Error("createUser method not found");
      const result = await baseAdapter.createUser(user);
      console.log("[AUTH DEBUG] Adapter createUser success, user id:", result?.id);
      return result;
    } catch (error: any) {
      console.error("[AUTH DEBUG] Adapter createUser ERROR:", error);
      console.error("[AUTH DEBUG] Adapter createUser ERROR message:", error?.message);
      console.error("[AUTH DEBUG] Adapter createUser ERROR stack:", error?.stack);
      throw error;
    }
  },
  async getUser(id: string) {
    try {
      console.log("[AUTH DEBUG] Adapter getUser called with id:", id);
      if (!baseAdapter.getUser) throw new Error("getUser method not found");
      const result = await baseAdapter.getUser(id);
      console.log("[AUTH DEBUG] Adapter getUser success:", result?.email || "NOT FOUND");
      return result;
    } catch (error: any) {
      console.error("[AUTH DEBUG] Adapter getUser ERROR:", error);
      throw error;
    }
  },
  async getUserByEmail(email: string) {
    try {
      console.log("[AUTH DEBUG] Adapter getUserByEmail called with:", email);
      if (!baseAdapter.getUserByEmail) throw new Error("getUserByEmail method not found");
      const result = await baseAdapter.getUserByEmail(email);
      console.log("[AUTH DEBUG] Adapter getUserByEmail success:", result?.email || "NOT FOUND");
      return result;
    } catch (error: any) {
      console.error("[AUTH DEBUG] Adapter getUserByEmail ERROR:", error);
      throw error;
    }
  },
  async getUserByAccount(account: any) {
    try {
      console.log("[AUTH DEBUG] Adapter getUserByAccount called with provider:", account?.provider, "providerAccountId:", account?.providerAccountId);
      if (!baseAdapter.getUserByAccount) throw new Error("getUserByAccount method not found");
      const result = await baseAdapter.getUserByAccount(account);
      console.log("[AUTH DEBUG] Adapter getUserByAccount success:", result?.email || "NOT FOUND");
      return result;
    } catch (error: any) {
      console.error("[AUTH DEBUG] Adapter getUserByAccount ERROR:", error);
      throw error;
    }
  },
  async linkAccount(account: any) {
    try {
      console.log("[AUTH DEBUG] Adapter linkAccount called with provider:", account?.provider);
      if (!baseAdapter.linkAccount) throw new Error("linkAccount method not found");
      const result = await baseAdapter.linkAccount(account);
      console.log("[AUTH DEBUG] Adapter linkAccount success");
      return result;
    } catch (error: any) {
      console.error("[AUTH DEBUG] Adapter linkAccount ERROR:", error);
      console.error("[AUTH DEBUG] Adapter linkAccount ERROR message:", error?.message);
      console.error("[AUTH DEBUG] Adapter linkAccount ERROR stack:", error?.stack);
      throw error;
    }
  },
  async createSession(session: any) {
    try {
      console.log("[AUTH DEBUG] Adapter createSession called with user id:", session?.userId);
      if (!baseAdapter.createSession) throw new Error("createSession method not found");
      const result = await baseAdapter.createSession(session);
      console.log("[AUTH DEBUG] Adapter createSession success, session token:", result?.sessionToken?.substring(0, 20) + "...");
      return result;
    } catch (error: any) {
      console.error("[AUTH DEBUG] Adapter createSession ERROR:", error);
      console.error("[AUTH DEBUG] Adapter createSession ERROR message:", error?.message);
      console.error("[AUTH DEBUG] Adapter createSession ERROR stack:", error?.stack);
      throw error;
    }
  },
};

export const authOptions: NextAuthOptions = {
  adapter: wrappedAdapter as any,
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
      // リダイレクトURIの確認
      console.log("[AUTH DEBUG] Redirect callback - url:", url, "baseUrl:", baseUrl);
      // カスタムリダイレクトURLがある場合はそれを使用
      if (url.startsWith(baseUrl)) {
        console.log("[AUTH DEBUG] Redirecting to custom URL:", url);
        return url;
      }
      // デフォルトはトップページにリダイレクト
      console.log("[AUTH DEBUG] Redirecting to baseUrl:", baseUrl);
      return baseUrl;
    },
    async session({ session, user }) {
      console.log("[AUTH DEBUG] Session callback - user exists:", !!user, "session user exists:", !!session.user);
      if (session.user && user) {
        session.user.id = user.id;
        console.log("[AUTH DEBUG] Session user ID set to:", user.id);
      } else {
        console.log("[AUTH DEBUG] WARNING: Session or user is missing!");
      }
      return session;
    },
    async signIn({ account, profile, user }) {
      // サインイン時のデバッグ情報
      try {
        console.log("[AUTH DEBUG] ========== SignIn callback triggered ==========");
        console.log("[AUTH DEBUG] User exists:", !!user);
        console.log("[AUTH DEBUG] User email:", user?.email || "NO USER");
        console.log("[AUTH DEBUG] User id:", user?.id || "NO USER ID");
        console.log("[AUTH DEBUG] Account exists:", !!account);
        console.log("[AUTH DEBUG] Account provider:", account?.provider || "NO ACCOUNT");
        console.log("[AUTH DEBUG] Profile exists:", !!profile);
        console.log("[AUTH DEBUG] Profile email:", profile?.email || "NO PROFILE");
        if (account) {
          console.log("[AUTH DEBUG] Account type:", account.type);
          console.log("[AUTH DEBUG] Account providerAccountId:", account.providerAccountId);
        }
        console.log("[AUTH DEBUG] ==============================================");
        return true;
      } catch (error: any) {
        console.error("[AUTH DEBUG] SignIn callback ERROR:", error);
        console.error("[AUTH DEBUG] SignIn callback ERROR message:", error?.message);
        console.error("[AUTH DEBUG] SignIn callback ERROR stack:", error?.stack);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      // データベースセッション戦略の場合でも、jwtコールバックが呼ばれることがある
      console.log("[AUTH DEBUG] JWT callback - user exists:", !!user, "account exists:", !!account);
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "database",
  },
  secret: nextAuthSecret,
  debug: true, // デバッグモードを有効化
  events: {
    async signIn({ user, account, profile }) {
      console.log("[AUTH DEBUG] ========== Event: signIn ==========");
      console.log("[AUTH DEBUG] Event - User email:", user?.email);
      console.log("[AUTH DEBUG] Event - Account provider:", account?.provider);
      console.log("[AUTH DEBUG] Event - Profile email:", profile?.email);
      console.log("[AUTH DEBUG] =====================================");
    },
    async createUser({ user }) {
      console.log("[AUTH DEBUG] ========== Event: createUser ==========");
      console.log("[AUTH DEBUG] Event - Created user:", user?.email, user?.id);
      console.log("[AUTH DEBUG] =========================================");
    },
    async linkAccount({ user, account }) {
      console.log("[AUTH DEBUG] ========== Event: linkAccount ==========");
      console.log("[AUTH DEBUG] Event - User:", user?.email);
      console.log("[AUTH DEBUG] Event - Account provider:", account?.provider);
      console.log("[AUTH DEBUG] ==========================================");
    },
  },
};

export async function auth() {
  return await getServerSession(authOptions);
}
