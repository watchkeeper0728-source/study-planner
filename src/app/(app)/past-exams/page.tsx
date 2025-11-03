"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PastExamsTable } from "@/components/PastExamsTable";
import { PastExam } from "@prisma/client";
import { toast } from "sonner";

export default function PastExamsPage() {
  const { data: sessionData, status } = useAuth();
  const session = sessionData?.session;
  const [pastExams, setPastExams] = useState<PastExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/past-exams");

      if (response.ok) {
        const data = await response.json();
        setPastExams(data || []);
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

  const handlePastExamCreate = async (examData: Omit<PastExam, "id" | "userId" | "createdAt" | "updatedAt">) => {
    try {
      const response = await fetch("/api/past-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examData),
      });

      if (response.ok) {
        const newExam = await response.json();
        setPastExams(prev => [...prev, newExam]);
      } else {
        const error = await response.json();
        throw new Error(error.error || "過去問の追加に失敗しました");
      }
    } catch (error) {
      console.error("過去問作成エラー:", error);
      toast.error(error instanceof Error ? error.message : "過去問の追加に失敗しました");
      throw error;
    }
  };

  const handlePastExamUpdate = async (id: string, updates: Partial<PastExam>) => {
    try {
      const response = await fetch(`/api/past-exams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedExam = await response.json();
        setPastExams(prev => prev.map(exam => exam.id === id ? updatedExam : exam));
      } else {
        const error = await response.json();
        throw new Error(error.error || "過去問の更新に失敗しました");
      }
    } catch (error) {
      console.error("過去問更新エラー:", error);
      toast.error(error instanceof Error ? error.message : "過去問の更新に失敗しました");
      throw error;
    }
  };

  const handlePastExamDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/past-exams/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPastExams(prev => prev.filter(exam => exam.id !== id));
      } else {
        const error = await response.json();
        throw new Error(error.error || "過去問の削除に失敗しました");
      }
    } catch (error) {
      console.error("過去問削除エラー:", error);
      toast.error(error instanceof Error ? error.message : "過去問の削除に失敗しました");
      throw error;
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
            過去問ページを利用するにはログインしてください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <PastExamsTable
          pastExams={pastExams}
          onPastExamCreate={handlePastExamCreate}
          onPastExamUpdate={handlePastExamUpdate}
          onPastExamDelete={handlePastExamDelete}
        />
      </div>
    </div>
  );
}

