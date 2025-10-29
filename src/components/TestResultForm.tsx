"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Save } from "lucide-react";
import { Subject, Test, Reflection } from "@prisma/client";
import { getSubjectConfig } from "@/lib/subject";

interface TestResultFormProps {
  tests: Test[];
  reflections: (Reflection & { test: Test })[];
  onReflectionCreate: (reflection: Omit<Reflection, "id" | "userId" | "createdAt">) => void;
}

export function TestResultForm({ tests, reflections, onReflectionCreate }: TestResultFormProps) {
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [newReflection, setNewReflection] = useState({
    testId: "",
    subject: "MATH" as Subject,
    score: "",
    deviation: "",
    approach: "",
    learning: "",
  });

  const subjects: Subject[] = ["MATH", "JAPANESE", "SCIENCE", "SOCIAL"];

  const handleTestSelect = (testId: string) => {
    setSelectedTest(testId);
    setNewReflection(prev => ({ ...prev, testId }));
  };

  const handleCreateReflection = () => {
    if (newReflection.testId && newReflection.subject) {
      onReflectionCreate({
        testId: newReflection.testId,
        subject: newReflection.subject,
        score: newReflection.score ? parseInt(newReflection.score) : null,
        deviation: newReflection.deviation ? parseFloat(newReflection.deviation) : null,
        approach: newReflection.approach || null,
        learning: newReflection.learning || null,
      });
      
      setNewReflection({
        testId: "",
        subject: "MATH",
        score: "",
        deviation: "",
        approach: "",
        learning: "",
      });
      setSelectedTest("");
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

      {/* 結果入力フォーム */}
      {selectedTest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">結果を入力</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">科目</Label>
                <Select
                  value={newReflection.subject}
                  onValueChange={(value) => setNewReflection({ ...newReflection, subject: value as Subject })}
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
                <Label htmlFor="score">点数</Label>
                <Input
                  id="score"
                  type="number"
                  value={newReflection.score}
                  onChange={(e) => setNewReflection({ ...newReflection, score: e.target.value })}
                  placeholder="例: 85"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="deviation">偏差値</Label>
                <Input
                  id="deviation"
                  type="number"
                  value={newReflection.deviation}
                  onChange={(e) => setNewReflection({ ...newReflection, deviation: e.target.value })}
                  placeholder="例: 65.2"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="approach">観点①: テストの受け方</Label>
              <Textarea
                id="approach"
                value={newReflection.approach}
                onChange={(e) => setNewReflection({ ...newReflection, approach: e.target.value })}
                placeholder="時間配分、見直しの方法、緊張の対処法など"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="learning">観点②: 学習内容</Label>
              <Textarea
                id="learning"
                value={newReflection.learning}
                onChange={(e) => setNewReflection({ ...newReflection, learning: e.target.value })}
                placeholder="理解できなかった分野、復習が必要な内容など"
                rows={3}
              />
            </div>

            <Button onClick={handleCreateReflection} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              保存
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