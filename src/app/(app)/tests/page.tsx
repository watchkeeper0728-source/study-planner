"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { TestResultFormNew } from "@/components/TestResultFormNew";
import { ReflectionsList } from "@/components/ReflectionsList";
import { Test, Reflection } from "@prisma/client";
import { toast } from "sonner";

interface ReflectionWithTest extends Reflection {
  test: Test;
}

export default function TestsPage() {
  const { data: sessionData, status } = useAuth();
  const session = sessionData?.session;
  const [tests, setTests] = useState<Test[]>([]);
  const [reflections, setReflections] = useState<ReflectionWithTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [testsRes, reflectionsRes] = await Promise.all([
        fetch("/api/tests"),
        fetch("/api/reflections"),
      ]);

      if (testsRes.ok) {
        const testsData = await testsRes.json();
        setTests(testsData);
      }

      if (reflectionsRes.ok) {
        const reflectionsData = await reflectionsRes.json();
        setReflections(reflectionsData);
      }
    } catch (error) {
      console.error("データ取得エラー:", error);
      toast.error("データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCreate = async (testData: Omit<Test, "id" | "userId" | "createdAt" | "updatedAt">) => {
    try {
      const response = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testData,
          date: testData.date.toISOString(),
        }),
      });

      if (response.ok) {
        const newTest = await response.json();
        setTests(prev => [...prev, newTest]);
        toast.success("テストを追加しました");
      } else {
        const error = await response.json();
        throw new Error(error.error || "テストの追加に失敗しました");
      }
    } catch (error) {
      console.error("テスト作成エラー:", error);
      toast.error(error instanceof Error ? error.message : "テストの追加に失敗しました");
    }
  };

  const handleTestUpdate = async (id: string, updates: Partial<Test>) => {
    try {
      const response = await fetch(`/api/tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          date: updates.date ? updates.date.toISOString() : undefined,
        }),
      });

      if (response.ok) {
        const updatedTest = await response.json();
        setTests(prev => prev.map(test => test.id === id ? updatedTest : test));
        toast.success("テストを更新しました");
      } else {
        throw new Error("テストの更新に失敗しました");
      }
    } catch (error) {
      console.error("テスト更新エラー:", error);
      toast.error("テストの更新に失敗しました");
    }
  };

  const handleTestDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/tests/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTests(prev => prev.filter(test => test.id !== id));
        setReflections(prev => prev.filter(reflection => reflection.testId !== id));
        toast.success("テストを削除しました");
      } else {
        throw new Error("テストの削除に失敗しました");
      }
    } catch (error) {
      console.error("テスト削除エラー:", error);
      toast.error("テストの削除に失敗しました");
    }
  };

  const handleReflectionCreate = async (reflectionData: Omit<Reflection, "id" | "userId" | "createdAt">) => {
    try {
      const response = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reflectionData),
      });

      if (response.ok) {
        const newReflection = await response.json();
        // テスト情報を追加
        const test = tests.find(t => t.id === reflectionData.testId);
        if (test) {
          const reflectionWithTest = { ...newReflection, test };
          setReflections(prev => [...prev, reflectionWithTest]);
        }
      } else {
        throw new Error("反省の記録に失敗しました");
      }
    } catch (error) {
      console.error("反省記録エラー:", error);
      toast.error("反省の記録に失敗しました");
      throw error;
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
            テストページを利用するにはログインしてください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <TestResultFormNew
          tests={tests}
          reflections={reflections}
          onReflectionCreate={handleReflectionCreate}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <ReflectionsList reflections={reflections} />
      </div>
    </div>
  );
}