"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MiniWeekCalendar } from "@/components/MiniWeekCalendar";
import { StudyTodoTabs } from "@/components/StudyTodoTabs";
import { TestCountdownBar } from "@/components/TestCountdownBar";
import { Subject, Todo, Plan, Test, Reflection } from "@prisma/client";
import { toast } from "sonner";

interface PlanWithSubject extends Plan {
  subject: Subject;
}

interface ReflectionWithTest extends Reflection {
  test: Test;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [plans, setPlans] = useState<PlanWithSubject[]>([]);
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
      // 現在の年を使ってデータを取得
      const currentYear = new Date().getFullYear();
      const fromDate = `${currentYear}-01-01`;
      const toDate = `${currentYear}-12-31`;
      
      const [todosRes, plansRes, testsRes, reflectionsRes] = await Promise.all([
        fetch("/api/todo"),
        fetch(`/api/plan?from=${fromDate}&to=${toDate}`),
        fetch("/api/tests"),
        fetch("/api/reflections"),
      ]);

      if (todosRes.ok) {
        const todosData = await todosRes.json();
        setTodos(todosData || []);
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        // start と end を Date オブジェクトに変換
        const plansWithDates = (plansData || []).map((plan: any) => ({
          ...plan,
          start: new Date(plan.start),
          end: new Date(plan.end),
        }));
        setPlans(plansWithDates);
      }

      if (testsRes.ok) {
        const testsData = await testsRes.json();
        setTests(testsData || []);
      }

      if (reflectionsRes.ok) {
        const reflectionsData = await reflectionsRes.json();
        setReflections(reflectionsData || []);
      }
    } catch (error) {
      console.error("データ取得エラー:", error);
      toast.error("データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTodoCreate = async (todoData: Omit<Todo, "id" | "userId" | "createdAt" | "updatedAt">) => {
    try {
      console.log("送信するデータ:", todoData);
      const response = await fetch("/api/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todoData),
      });

      if (response.ok) {
        const newTodo = await response.json();
        setTodos(prev => [...prev, newTodo]);
        toast.success("ToDoを作成しました");
      } else {
        const errorData = await response.json();
        console.error("APIレスポンスエラー:", errorData);
        throw new Error(errorData.error || "ToDoの作成に失敗しました");
      }
    } catch (error: any) {
      console.error("ToDo作成エラー:", error);
      toast.error(error.message || "ToDoの作成に失敗しました");
    }
  };

  const handleTodoUpdate = async (id: string, updates: Partial<Todo>) => {
    try {
      const response = await fetch(`/api/todo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(prev => prev.map(todo => todo.id === id ? updatedTodo : todo));
        toast.success("ToDoを更新しました");
      } else {
        throw new Error("ToDoの更新に失敗しました");
      }
    } catch (error) {
      console.error("ToDo更新エラー:", error);
      toast.error("ToDoの更新に失敗しました");
    }
  };

  const handleTodoDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/todo/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTodos(prev => prev.filter(todo => todo.id !== id));
        toast.success("ToDoを削除しました");
      } else {
        throw new Error("ToDoの削除に失敗しました");
      }
    } catch (error) {
      console.error("ToDo削除エラー:", error);
      toast.error("ToDoの削除に失敗しました");
    }
  };

  const handlePlanCreate = async (planData: { title: string; start: string; end: string; subject: Subject }) => {
    try {
      console.log("Creating plan:", planData);
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        const newPlan = await response.json();
        console.log("Created plan:", newPlan);
        // subjectを含め、start と end を Date オブジェクトに変換
        const planWithSubject: PlanWithSubject = {
          ...newPlan,
          subject: newPlan.subject,
          start: new Date(newPlan.start),
          end: new Date(newPlan.end),
        };
        console.log("Adding plan to state:", planWithSubject);
        setPlans(prev => [...prev, planWithSubject]);
        toast.success("予定を作成しました");
      } else {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(errorData.error || "予定の作成に失敗しました");
      }
    } catch (error) {
      console.error("予定作成エラー:", error);
      toast.error("予定の作成に失敗しました");
    }
  };

  const handlePlanUpdate = async (id: string, updates: { start?: string; end?: string; title?: string }) => {
    try {
      const response = await fetch(`/api/plan/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedPlan = await response.json();
        setPlans(prev => prev.map(plan => plan.id === id ? updatedPlan : plan));
        toast.success("予定を更新しました");
      } else {
        throw new Error("予定の更新に失敗しました");
      }
    } catch (error) {
      console.error("予定更新エラー:", error);
      toast.error("予定の更新に失敗しました");
    }
  };

  const handlePlanDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/plan/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPlans(prev => prev.filter(plan => plan.id !== id));
        toast.success("予定を削除しました");
      } else {
        throw new Error("予定の削除に失敗しました");
      }
    } catch (error) {
      console.error("予定削除エラー:", error);
      toast.error("予定の削除に失敗しました");
    }
  };

  const handlePlanDeleteAll = async () => {
    if (!confirm("すべての予定を削除しますか？この操作は元に戻せません。")) {
      return;
    }

    try {
      const response = await fetch("/api/plan", {
        method: "DELETE",
      });

      if (response.ok) {
        setPlans([]);
        toast.success("すべての予定を削除しました");
      } else {
        throw new Error("予定の一括削除に失敗しました");
      }
    } catch (error) {
      console.error("予定一括削除エラー:", error);
      toast.error("予定の一括削除に失敗しました");
    }
  };

  const handlePlanComplete = async (plan: { id: string; title: string; start: Date | string; end: Date | string; subject: Subject }) => {
    try {
      // start と end をDateオブジェクトに変換
      const startDate = new Date(plan.start);
      const endDate = new Date(plan.end);
      
      // 学習時間を計算（分）
      const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
      
      // 学習記録を保存
      const studyLog = {
        title: plan.title,
        date: startDate.toISOString(),
        subject: plan.subject,
        minutes: durationMinutes,
        planId: plan.id,
      };

      const response = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studyLog),
      });

      if (response.ok) {
        toast.success("学習記録を保存しました");
        // 予定を削除
        await handlePlanDelete(plan.id);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "学習記録の保存に失敗しました");
      }
    } catch (error) {
      console.error("予定完了エラー:", error);
      toast.error(error instanceof Error ? error.message : "学習記録の保存に失敗しました");
    }
  };

  const handleTestCreate = async (testData: Omit<Test, "id" | "userId" | "createdAt" | "updatedAt">) => {
    try {
      const response = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
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

  const handleTestDelete = async (id: string) => {
    try {
      console.log("テスト削除APIを呼び出し中:", id);
      const response = await fetch(`/api/tests/${id}`, {
        method: "DELETE",
      });

      console.log("レスポンスstatus:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("削除成功:", result);
        setTests(prev => prev.filter(test => test.id !== id));
        setReflections(prev => prev.filter(reflection => reflection.testId !== id));
        toast.success("テストを削除しました");
      } else {
        const errorData = await response.json();
        console.error("削除失敗:", errorData);
        throw new Error(errorData.error || "テストの削除に失敗しました");
      }
    } catch (error) {
      console.error("テスト削除エラー:", error);
      toast.error(error instanceof Error ? error.message : "テストの削除に失敗しました");
    }
  };

  const handleTestComplete = (testId: string) => {
    // テストページに遷移（TestCountdownBarで既に遷移しているが、念のため）
    router.push("/tests");
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
          <h1 className="text-2xl font-bold mb-4">Study Planner</h1>
          <p className="text-gray-600 mb-8">
            Googleアカウントでログインして、学習予定を管理しましょう
          </p>
                    </div>
                  </div>
    );
                }
                
                return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <MiniWeekCalendar
            plans={plans}
            onPlanCreate={handlePlanCreate}
            onPlanUpdate={handlePlanUpdate}
            onPlanDelete={handlePlanDelete}
            onPlanDeleteAll={handlePlanDeleteAll}
            onPlanComplete={handlePlanComplete}
          />
                            </div>

        <div className="bg-white rounded-lg shadow-sm border study-todo">
          <StudyTodoTabs
            todos={todos}
            onTodoCreate={handleTodoCreate}
            onTodoUpdate={handleTodoUpdate}
            onTodoDelete={handleTodoDelete}
            onDragStart={() => {}}
          />
                    </div>
      </div>

      <div className="mt-6 border-t pt-4 bg-white test-countdown">
        <TestCountdownBar
          tests={tests}
          reflections={reflections}
          onTestCreate={handleTestCreate}
          onTestDelete={handleTestDelete}
          onTestComplete={handleTestComplete}
        />
      </div>
    </div>
  );
}