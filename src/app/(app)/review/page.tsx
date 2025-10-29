"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DailyReviewPane } from "@/components/DailyReviewPane";
import { Subject, Plan, StudyLog } from "@prisma/client";
import { format, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";

interface PlanWithSubject extends Plan {
  subject: Subject;
}

export default function ReviewPage() {
  const { data: session, status } = useSession();
  const [plans, setPlans] = useState<PlanWithSubject[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, selectedDate]);

  const fetchData = async () => {
    try {
      const startDate = startOfDay(selectedDate).toISOString();
      const endDate = endOfDay(selectedDate).toISOString();

      const [plansRes, logsRes] = await Promise.all([
        fetch(`/api/plan?from=${startDate}&to=${endDate}`),
        fetch(`/api/log?from=${startDate}&to=${endDate}`),
      ]);

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
    } catch (error) {
      console.error("データ取得エラー:", error);
      toast.error("データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogCreate = async (logData: Omit<StudyLog, "id" | "userId" | "createdAt" | "updatedAt">) => {
    try {
      const response = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...logData,
          date: logData.date.toISOString(),
        }),
      });

      if (response.ok) {
        const newLog = await response.json();
        setLogs(prev => [...prev, newLog]);
        toast.success("実績を記録しました");
      } else {
        throw new Error("実績の記録に失敗しました");
      }
    } catch (error) {
      console.error("実績記録エラー:", error);
      toast.error("実績の記録に失敗しました");
    }
  };

  const handleLogUpdate = async (id: string, updates: Partial<StudyLog>) => {
    try {
      const response = await fetch(`/api/log/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          date: updates.date ? updates.date.toISOString() : undefined,
        }),
      });

      if (response.ok) {
        const updatedLog = await response.json();
        setLogs(prev => prev.map(log => log.id === id ? updatedLog : log));
        toast.success("実績を更新しました");
      } else {
        throw new Error("実績の更新に失敗しました");
      }
    } catch (error) {
      console.error("実績更新エラー:", error);
      toast.error("実績の更新に失敗しました");
    }
  };

  const handleLogDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/log/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setLogs(prev => prev.filter(log => log.id !== id));
        toast.success("実績を削除しました");
      } else {
        throw new Error("実績の削除に失敗しました");
      }
    } catch (error) {
      console.error("実績削除エラー:", error);
      toast.error("実績の削除に失敗しました");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
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
            レビューページを利用するにはログインしてください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">日次レビュー</h1>
        <div className="flex items-center gap-4">
          <label htmlFor="date-select" className="text-sm font-medium">
            日付選択:
          </label>
          <input
            id="date-select"
            type="date"
            value={format(selectedDate, "yyyy-MM-dd")}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <DailyReviewPane
          plans={plans}
          logs={logs}
          onLogCreate={handleLogCreate}
          onLogUpdate={handleLogUpdate}
          onLogDelete={handleLogDelete}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}