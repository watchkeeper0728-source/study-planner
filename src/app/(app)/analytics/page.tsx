"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { StudyTimeBar } from "@/components/StudyTimeBar";
import { StudyLog } from "@prisma/client";
import { startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const { data: sessionData, status } = useAuth();
  const session = sessionData?.session;
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const startDate = startOfMonth(new Date()).toISOString();
      const endDate = endOfMonth(new Date()).toISOString();

      const response = await fetch(`/api/log?from=${startDate}&to=${endDate}`);

      if (response.ok) {
        const logsData = await response.json();
        setLogs(logsData);
      } else {
        throw new Error("データの取得に失敗しました");
      }
    } catch (error) {
      console.error("データ取得エラー:", error);
      toast.error("データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">ログインが必要です</h1>
          <p className="text-gray-600">
            分析ページを利用するにはログインしてください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <StudyTimeBar logs={logs} />
      </div>
    </div>
  );
}