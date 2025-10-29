"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";
import { Test, Reflection } from "@prisma/client";
import { toast } from "sonner";

interface TestCountdownBarProps {
  tests: Test[];
  reflections?: (Reflection & { test: Test })[];
  onTestCreate: (test: Omit<Test, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  onTestDelete: (id: string) => void;
  onTestComplete?: (testId: string) => void;
}

export function TestCountdownBar({ tests, reflections = [], onTestCreate, onTestDelete, onTestComplete }: TestCountdownBarProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    name: "",
    date: "",
  });

  // 反省が存在するテストを完了済みとして判定
  const completedTestIds = new Set(reflections.map(r => r.testId));

  const handleComplete = (testId: string) => {
    if (completedTestIds.has(testId)) {
      toast.info("このテストは既に完了しています");
      router.push("/tests");
      return;
    }

    if (onTestComplete) {
      onTestComplete(testId);
    }
    
    // テストページに遷移して反省を入力
    toast.success("テストページで反省を入力してください");
    router.push("/tests");
  };

  const handleCreateTest = () => {
    if (newTest.name.trim() && newTest.date) {
      onTestCreate({
        name: newTest.name,
        date: new Date(newTest.date),
      });
      setNewTest({ name: "", date: "" });
      setIsDialogOpen(false);
    }
  };

  const getDaysUntilTest = (testDate: Date) => {
    const today = new Date();
    const diff = differenceInDays(testDate, today);
    return diff;
  };

  const getCountdownColor = (days: number) => {
    if (days < 0) return "bg-gray-100 text-gray-600";
    if (days <= 7) return "bg-red-100 text-red-700";
    if (days <= 14) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  const getCountdownText = (days: number) => {
    if (days < 0) return "終了済み";
    if (days === 0) return "今日";
    if (days === 1) return "明日";
    return `あと${days}日`;
  };

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" aria-label="テストカウントダウン">
            テストカウントダウン
          </h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                disabled={tests.length >= 3}
                aria-label="新しいテストを追加"
              >
                <Plus className="h-4 w-4 mr-2" />
                テスト追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新しいテストを追加</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="test-name">テスト名</Label>
                  <Input
                    id="test-name"
                    value={newTest.name}
                    onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                    placeholder="例: 第1回模擬試験"
                  />
                </div>
                <div>
                  <Label htmlFor="test-date">テスト日</Label>
                  <Input
                    id="test-date"
                    type="date"
                    value={newTest.date}
                    onChange={(e) => setNewTest({ ...newTest, date: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateTest} className="w-full">
                  追加
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {tests.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            テストが登録されていません
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {tests.map((test) => {
              const days = getDaysUntilTest(new Date(test.date));
              const countdownText = getCountdownText(days);
              const countdownColor = getCountdownColor(days);
              
              return (
                <Card 
                  key={test.id} 
                  className={`hover:shadow-md transition-shadow ${completedTestIds.has(test.id) ? "bg-gray-100" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className={`text-sm font-medium ${completedTestIds.has(test.id) ? "line-through text-gray-500" : ""}`}>
                        {test.name}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleComplete(test.id)}
                          className="bg-green-500 hover:bg-green-600"
                          disabled={completedTestIds.has(test.id)}
                        >
                          完了
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onTestDelete(test.id)}
                          aria-label={`${test.name}を削除`}
                        >
                          削除
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(test.date), "M月d日(E)", { locale: ja })}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${countdownColor}`}>
                        {completedTestIds.has(test.id) ? "完了" : countdownText}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {tests.length >= 3 && (
          <div className="text-center text-sm text-gray-500 mt-4">
            テストは最大3件まで登録できます
          </div>
        )}
      </div>
    </div>
  );
}