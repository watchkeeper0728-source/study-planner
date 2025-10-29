"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Clock } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Subject, Plan, StudyLog } from "@prisma/client";
import { getSubjectConfig } from "@/lib/subject";

interface DailyReviewPaneProps {
  plans: Plan[];
  logs: StudyLog[];
  onLogCreate: (log: Omit<StudyLog, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  onLogUpdate: (id: string, updates: Partial<StudyLog>) => void;
  onLogDelete: (id: string) => void;
  selectedDate: Date;
}

export function DailyReviewPane({
  plans,
  logs,
  onLogCreate,
  onLogUpdate,
  onLogDelete,
  selectedDate,
}: DailyReviewPaneProps) {
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [newLog, setNewLog] = useState({
    title: "",
    subject: "MATH" as Subject,
    minutes: 60,
    comment: "",
    planId: "",
  });

  const subjects: Subject[] = ["MATH", "JAPANESE", "SCIENCE", "SOCIAL"];

  const handleCopyFromPlan = (plan: Plan) => {
    setNewLog({
      title: plan.title,
      subject: plan.subject,
      minutes: Math.floor((new Date(plan.end).getTime() - new Date(plan.start).getTime()) / (1000 * 60)),
      comment: "",
      planId: plan.id,
    });
    setIsAddingLog(true);
  };

  const handleCreateLog = () => {
    if (newLog.title.trim() && newLog.minutes > 0) {
      onLogCreate({
        ...newLog,
        date: selectedDate,
      });
      setNewLog({
        title: "",
        subject: "MATH",
        minutes: 60,
        comment: "",
        planId: "",
      });
      setIsAddingLog(false);
    }
  };

  const totalMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* 左側: 予定一覧 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" aria-label="当日の予定">
            {format(selectedDate, "M月d日(E)", { locale: ja })}の予定
          </h3>
          <Badge variant="outline">
            {plans.length}件
          </Badge>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {plans.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              予定はありません
            </div>
          ) : (
            plans.map((plan) => {
              const config = getSubjectConfig(plan.subject);
              const startTime = format(new Date(plan.start), "HH:mm", { locale: ja });
              const endTime = format(new Date(plan.end), "HH:mm", { locale: ja });
              
              return (
                <Card key={plan.id} className={config.borderColor}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium">
                        {plan.title}
                      </CardTitle>
                      <Badge className={config.bgColor + " " + config.textColor}>
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-3 w-3" />
                        {startTime} - {endTime}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyFromPlan(plan)}
                        aria-label={`${plan.title}を実績にコピー`}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        コピー
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* 右側: 実績入力 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" aria-label="学習実績">
            学習実績
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              合計: {hours}時間{minutes}分
            </Badge>
            <Button
              size="sm"
              onClick={() => setIsAddingLog(true)}
              aria-label="新しい実績を追加"
            >
              <Plus className="h-4 w-4 mr-1" />
              追加
            </Button>
          </div>
        </div>

        {/* 実績入力フォーム */}
        {isAddingLog && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">新しい実績を追加</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="log-title">タイトル</Label>
                <Input
                  id="log-title"
                  value={newLog.title}
                  onChange={(e) => setNewLog({ ...newLog, title: e.target.value })}
                  placeholder="学習内容"
                />
              </div>
              <div>
                <Label htmlFor="log-subject">科目</Label>
                <Select
                  value={newLog.subject}
                  onValueChange={(value) => setNewLog({ ...newLog, subject: value as Subject })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => {
                      const config = getSubjectConfig(subject);
                      return (
                        <SelectItem key={subject} value={subject}>
                          {config.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="log-minutes">学習時間（分）</Label>
                <Input
                  id="log-minutes"
                  type="number"
                  value={newLog.minutes}
                  onChange={(e) => setNewLog({ ...newLog, minutes: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="480"
                />
              </div>
              <div>
                <Label htmlFor="log-comment">コメント</Label>
                <Textarea
                  id="log-comment"
                  value={newLog.comment}
                  onChange={(e) => setNewLog({ ...newLog, comment: e.target.value })}
                  placeholder="学習の感想や気づき"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateLog} className="flex-1">
                  保存
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingLog(false)}
                  className="flex-1"
                >
                  キャンセル
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 実績一覧 */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              実績はありません
            </div>
          ) : (
            logs.map((log) => {
              const config = getSubjectConfig(log.subject);
              
              return (
                <Card key={log.id} className={config.borderColor}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium">
                        {log.title}
                      </CardTitle>
                      <Badge className={config.bgColor + " " + config.textColor}>
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-3 w-3" />
                        {log.minutes}分
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onLogDelete(log.id)}
                        aria-label={`${log.title}を削除`}
                      >
                        削除
                      </Button>
                    </div>
                    {log.comment && (
                      <p className="text-xs text-gray-500 mt-2">{log.comment}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}