"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StudyLog {
  id: string;
  title: string;
  subject: string;
  date: string;
  minutes: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

const subjectLabels: Record<string, string> = {
  MATH: "数学",
  JAPANESE: "国語",
  SCIENCE: "理科",
  SOCIAL: "社会",
};

const subjectColors: Record<string, string> = {
  MATH: "bg-red-100 text-red-800",
  JAPANESE: "bg-blue-100 text-blue-800",
  SCIENCE: "bg-green-100 text-green-800",
  SOCIAL: "bg-yellow-100 text-yellow-800",
};

export default function LogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      fetchLogs();
    }
  }, [status, router]);

  const fetchLogs = async () => {
    try {
      // 過去1年のデータを取得
      const to = new Date();
      const from = new Date();
      from.setFullYear(from.getFullYear() - 1);

      const response = await fetch(
        `/api/log?from=${from.toISOString()}&to=${to.toISOString()}`
      );

      if (!response.ok) {
        throw new Error("学習記録の取得に失敗しました");
      }

      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("学習記録取得エラー:", error);
      toast.error("学習記録の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この学習記録を削除しますか？")) {
      return;
    }

    try {
      const response = await fetch(`/api/log/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("学習記録を削除しました");
        fetchLogs();
      } else {
        throw new Error("学習記録の削除に失敗しました");
      }
    } catch (error) {
      console.error("学習記録削除エラー:", error);
      toast.error("学習記録の削除に失敗しました");
    }
  };

  // 日付ごとにグループ化し、時間を計算
  const groupedLogs = logs.reduce((acc, log) => {
    const date = format(new Date(log.date), "yyyy-MM-dd");
    
    if (!acc[date]) {
      acc[date] = {
        date: new Date(log.date),
        logs: [],
        totalMinutes: 0,
      };
    }
    
    acc[date].logs.push(log);
    acc[date].totalMinutes += log.minutes;
    
    return acc;
  }, {} as Record<string, { date: Date; logs: StudyLog[]; totalMinutes: number }>);

  // 累計勉強時間を計算
  const totalMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMinutesOnly = totalMinutes % 60;

  // 日付順にソート（新しい順）
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">学習記録</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <p>
              累計学習時間: <strong className="text-blue-600">{totalHours}時間{totalMinutesOnly}分</strong>
            </p>
            <p>
              記録数: <strong>{logs.length}件</strong>
            </p>
          </div>
        </div>

        {sortedDates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">まだ学習記録がありません</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => {
              const { date, logs: dayLogs, totalMinutes: dayTotalMinutes } = groupedLogs[dateKey];
              const dayHours = Math.floor(dayTotalMinutes / 60);
              const dayMinutesOnly = dayTotalMinutes % 60;

              return (
                <Card key={dateKey}>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">
                        {format(date, "yyyy年M月d日(E)", { locale: ja })}
                      </CardTitle>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          学習時間: <strong className="text-blue-600">{dayHours}時間{dayMinutesOnly}分</strong>
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {dayLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <Badge className={subjectColors[log.subject]}>
                              {subjectLabels[log.subject]}
                            </Badge>
                            <div>
                              <p className="font-medium text-gray-900">{log.title}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(log.date), "HH:mm", { locale: ja })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-gray-700">
                              {Math.floor(log.minutes / 60)}時間{log.minutes % 60}分
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(log.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              削除
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


