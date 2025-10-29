"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

export function TopNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Study Planner</h1>
            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" aria-label="Study Planner">
            Study Planner
          </h1>
          
          {session ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "ユーザー"}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium">
                  {session.user?.name || session.user?.email}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                aria-label="ログアウト"
              >
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              aria-label="Googleでログイン"
            >
              <User className="h-4 w-4 mr-2" />
              Googleでログイン
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}