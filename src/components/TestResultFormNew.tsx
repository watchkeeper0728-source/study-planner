"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { Subject, Test, Reflection } from "@prisma/client";
import { getSubjectConfig } from "@/lib/subject";
import { toast } from "sonner";

interface TestResultFormNewProps {
  tests: Test[];
  reflections: (Reflection & { test: Test })[];
  onReflectionCreate: (reflection: Omit<Reflection, "id" | "userId" | "createdAt">) => void;
}

export function TestResultFormNew({ tests, reflections, onReflectionCreate }: TestResultFormNewProps) {
  const [selectedTest, setSelectedTest] = useState<string>("");
  
  const subjects: Subject[] = ["MATH", "JAPANESE", "SCIENCE", "SOCIAL"];
  
  // 各科目の入力状態を管理
  const [formData, setFormData] = useState<Record<Subject, {
    score: string;
    deviation: string;
    approach: string;
    learning: string;
  }>>({
    MATH: { score: "", deviation: "", approach: "", learning: "" },
    JAPANESE: { score: "", deviation: "", approach: "", learning: "" },
    SCIENCE: { score: "", deviation: "", approach: "", learning: "" },
    SOCIAL: { score: "", deviation: "", approach: "", learning: "" },
  });

  const handleTestSelect = (testId: string) => {
    setSelectedTest(testId);
  };

  const handleSubjectChange = (subject: Subject, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [field]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    if (!selectedTest) return;
    
    let savedCount = 0;
    for (const subject of subjects) {
      const data = formData[subject];
      if (data.approach || data.learning || data.score || data.deviation) {
        try {
          await onReflectionCreate({
            testId: selectedTest,
            subject,
            score: data.score ? parseInt(data.score) : null,
            deviation: data.deviation ? parseFloat(data.deviation) : null,
            approach: data.approach || null,
            learning: data.learning || null,
          });
          savedCount++;
        } catch (error) {
          console.error(`反省の記録エラー (${subject}):`, error);
        }
      }
    }
    
    if (savedCount > 0) {
      toast.success(`${savedCount}件の反省を記録しました`);
      // フォームをリセット
      setFormData({
        MATH: { score: "", deviation: "", approach: "", learning: "" },
        JAPANESE: { score: "", deviation: "", approach: "", learning: "" },
        SCIENCE: { score: "", deviation: "", approach: "", learning: "" },
        SOCIAL: { score: "", deviation: "", approach: "", learning: "" },
      });
      setSelectedTest("");
    } else {
      toast.info("入力されたデータがありません");
    }
  };

  const getExistingReflections = (testId: string, subject: Subject) => {
    return reflections.filter(r => r.testId === testId && r.subject === subject);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" aria-label="テスト結果入力">
          テスト結果入力
        </h2>
      </div>

      {/* テスト選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">テストを選択</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tests.map((test) => (
              <Card
                key={test.id}
                className={`cursor-pointer transition-colors ${
                  selectedTest === test.id ? "ring-2 ring-blue-500" : "hover:bg-gray-50"
                }`}
                onClick={() => handleTestSelect(test.id)}
              >
                <CardContent className="p-4">
                  <div className="text-sm font-medium">{test.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(test.date).toLocaleDateString("ja-JP")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 四科目一括入力フォーム */}
      {selectedTest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">結果を入力（四科目一括）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {subjects.map((subject) => {
                const config = getSubjectConfig(subject);
                const data = formData[subject];
                const existingReflections = getExistingReflections(selectedTest, subject);
                
                return (
                  <div key={subject} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={config.bgColor + " " + config.textColor}>
                        {config.label}
                      </Badge>
                      {existingReflections.length > 0 && (
                        <span className="text-sm text-gray-500">
                          {existingReflections.length}件の結果あり
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${subject}-score`}>点数</Label>
                        <Input
                          id={`${subject}-score`}
                          type="number"
                          value={data.score}
                          onChange={(e) => handleSubjectChange(subject, "score", e.target.value)}
                          placeholder="例: 85"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${subject}-deviation`}>偏差値</Label>
                        <Input
                          id={`${subject}-deviation`}
                          type="number"
                          value={data.deviation}
                          onChange={(e) => handleSubjectChange(subject, "deviation", e.target.value)}
                          placeholder="例: 65.2"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`${subject}-approach`}>観点①: テストの受け方</Label>
                      <Textarea
                        id={`${subject}-approach`}
                        value={data.approach}
                        onChange={(e) => handleSubjectChange(subject, "approach", e.target.value)}
                        placeholder="時間配分、見直しの方法、緊張の対処法など"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`${subject}-learning`}>観点②: 学習内容</Label>
                      <Textarea
                        id={`${subject}-learning`}
                        value={data.learning}
                        onChange={(e) => handleSubjectChange(subject, "learning", e.target.value)}
                        placeholder="理解できなかった分野、復習が必要な内容など"
                        rows={2}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <Button onClick={handleSaveAll} className="w-full mt-4">
              <Save className="h-4 w-4 mr-2" />
              すべて保存
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 既存の結果表示 */}
      {selectedTest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">入力済みの結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjects.map((subject) => {
                const config = getSubjectConfig(subject);
                const existingReflections = getExistingReflections(selectedTest, subject);
                
                return (
                  <div key={subject} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={config.bgColor + " " + config.textColor}>
                        {config.label}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {existingReflections.length}件の結果
                      </span>
                    </div>
                    
                    {existingReflections.length === 0 ? (
                      <div className="text-sm text-gray-500">結果が入力されていません</div>
                    ) : (
                      <div className="space-y-2">
                        {existingReflections.map((reflection) => (
                          <div key={reflection.id} className="bg-gray-50 p-3 rounded">
                            <div className="flex items-center gap-4 text-sm">
                              {reflection.score && (
                                <span>点数: {reflection.score}</span>
                              )}
                              {reflection.deviation && (
                                <span>偏差値: {reflection.deviation}</span>
                              )}
                            </div>
                            {reflection.approach && (
                              <div className="mt-2">
                                <div className="text-xs font-medium text-gray-600">テストの受け方:</div>
                                <div className="text-sm">{reflection.approach}</div>
                              </div>
                            )}
                            {reflection.learning && (
                              <div className="mt-2">
                                <div className="text-xs font-medium text-gray-600">学習内容:</div>
                                <div className="text-sm">{reflection.learning}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

