"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { toast } from "sonner";

interface SessionUser {
  id: string;
  username: string;
  name: string | null;
}

export function TopNav() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      setSession(data.user);
    } catch (error) {
      console.error("Failed to fetch session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("ログアウトしました");
        setSession(null);
        router.push("/auth/signin");
        router.refresh();
      } else {
        throw new Error("ログアウトに失敗しました");
      }
    } catch (error: any) {
      toast.error(error.message || "ログアウトに失敗しました");
    }
  };

  if (isLoading) {
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
    <nav className="bg-white border-b fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" aria-label="Study Planner">
            Study Planner
          </h1>

          {session ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                  {(session.name || session.username)[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium">
                  {session.name || session.username}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                aria-label="ログアウト"
              >
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => router.push("/auth/signin")}
              aria-label="ログイン"
            >
              <User className="h-4 w-4 mr-2" />
              ログイン
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
