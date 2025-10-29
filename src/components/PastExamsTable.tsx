"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { PastExam } from "@prisma/client";
import { toast } from "sonner";

interface PastExamsTableProps {
  pastExams: PastExam[];
  onPastExamCreate: (exam: Omit<PastExam, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<void>;
  onPastExamUpdate: (id: string, exam: Partial<PastExam>) => Promise<void>;
  onPastExamDelete: (id: string) => Promise<void>;
}

export function PastExamsTable({ 
  pastExams, 
  onPastExamCreate, 
  onPastExamUpdate, 
  onPastExamDelete 
}: PastExamsTableProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<PastExam | null>(null);
  const [formData, setFormData] = useState({
    schoolName: "",
    year: new Date().getFullYear(),
    examNumber: 1,
    mathScore: "",
    mathPassing: "",
    japaneseScore: "",
    japanesePassing: "",
    scienceScore: "",
    sciencePassing: "",
    socialScore: "",
    socialPassing: "",
  });

  // 学校ごとにグループ化
  const groupedBySchool = pastExams.reduce((acc, exam) => {
    if (!acc[exam.schoolName]) {
      acc[exam.schoolName] = [];
    }
    acc[exam.schoolName].push(exam);
    return acc;
  }, {} as Record<string, PastExam[]>);

  const handleOpenDialog = (exam?: PastExam) => {
    if (exam) {
      setEditingExam(exam);
      setFormData({
        schoolName: exam.schoolName,
        year: exam.year,
        examNumber: exam.examNumber,
        mathScore: exam.mathScore?.toString() || "",
        mathPassing: exam.mathPassing?.toString() || "",
        japaneseScore: exam.japaneseScore?.toString() || "",
        japanesePassing: exam.japanesePassing?.toString() || "",
        scienceScore: exam.scienceScore?.toString() || "",
        sciencePassing: exam.sciencePassing?.toString() || "",
        socialScore: exam.socialScore?.toString() || "",
        socialPassing: exam.socialPassing?.toString() || "",
      });
    } else {
      setEditingExam(null);
      setFormData({
        schoolName: "",
        year: new Date().getFullYear(),
        examNumber: 1,
        mathScore: "",
        mathPassing: "",
        japaneseScore: "",
        japanesePassing: "",
        scienceScore: "",
        sciencePassing: "",
        socialScore: "",
        socialPassing: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingExam(null);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        schoolName: formData.schoolName,
        year: formData.year,
        examNumber: formData.examNumber,
        mathScore: formData.mathScore ? parseInt(formData.mathScore) : null,
        mathPassing: formData.mathPassing ? parseInt(formData.mathPassing) : null,
        japaneseScore: formData.japaneseScore ? parseInt(formData.japaneseScore) : null,
        japanesePassing: formData.japanesePassing ? parseInt(formData.japanesePassing) : null,
        scienceScore: formData.scienceScore ? parseInt(formData.scienceScore) : null,
        sciencePassing: formData.sciencePassing ? parseInt(formData.sciencePassing) : null,
        socialScore: formData.socialScore ? parseInt(formData.socialScore) : null,
        socialPassing: formData.socialPassing ? parseInt(formData.socialPassing) : null,
      };

      if (editingExam) {
        await onPastExamUpdate(editingExam.id, data);
        toast.success("過去問を更新しました");
      } else {
        await onPastExamCreate(data);
        toast.success("過去問を追加しました");
      }
      handleCloseDialog();
    } catch (error) {
      console.error("過去問保存エラー:", error);
      toast.error("過去問の保存に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この過去問を削除しますか？")) {
      return;
    }
    try {
      await onPastExamDelete(id);
      toast.success("過去問を削除しました");
    } catch (error) {
      console.error("過去問削除エラー:", error);
      toast.error("過去問の削除に失敗しました");
    }
  };

  const formatScore = (score: number | null | undefined, passing: number | null | undefined) => {
    if (score === null || score === undefined) return "-";
    const scoreStr = score.toString();
    if (passing !== null && passing !== undefined) {
      const isPassing = score >= passing;
      return (
        <span className={isPassing ? "text-green-600 font-semibold" : "text-red-600"}>
          {scoreStr} / {passing}
        </span>
      );
    }
    return scoreStr;
  };

  const calculateTotalScore = (exam: PastExam) => {
    const scores = [
      exam.japaneseScore,
      exam.mathScore,
      exam.scienceScore,
      exam.socialScore,
    ].filter((s): s is number => s !== null && s !== undefined);
    
    return scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0)
      : null;
  };

  const calculateTotalPassing = (exam: PastExam) => {
    const passings = [
      exam.japanesePassing,
      exam.mathPassing,
      exam.sciencePassing,
      exam.socialPassing,
    ].filter((p): p is number => p !== null && p !== undefined);
    
    return passings.length > 0
      ? passings.reduce((sum, passing) => sum + passing, 0)
      : null;
  };

  const calculateAchievementRate = (exam: PastExam) => {
    const totalScore = calculateTotalScore(exam);
    const totalPassing = calculateTotalPassing(exam);
    
    if (totalScore === null || totalPassing === null || totalPassing === 0) {
      return null;
    }
    
    return Math.round((totalScore / totalPassing) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">過去問スコア記録</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              過去問を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>{editingExam ? "過去問を編集" : "過去問を追加"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="schoolName">学校名 *</Label>
                  <Input
                    id="schoolName"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    placeholder="例: 開成中学校"
                  />
                </div>
                <div>
                  <Label htmlFor="year">年 *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                    min="2000"
                    max="2100"
                  />
                </div>
                <div>
                  <Label htmlFor="examNumber">回数 *</Label>
                  <Input
                    id="examNumber"
                    type="number"
                    value={formData.examNumber}
                    onChange={(e) => setFormData({ ...formData, examNumber: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">国語</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="japaneseScore">獲得スコア</Label>
                    <Input
                      id="japaneseScore"
                      type="number"
                      value={formData.japaneseScore}
                      onChange={(e) => setFormData({ ...formData, japaneseScore: e.target.value })}
                      min="0"
                      max="100"
                      placeholder="例: 85"
                    />
                  </div>
                  <div>
                    <Label htmlFor="japanesePassing">合格点</Label>
                    <Input
                      id="japanesePassing"
                      type="number"
                      value={formData.japanesePassing}
                      onChange={(e) => setFormData({ ...formData, japanesePassing: e.target.value })}
                      min="0"
                      max="100"
                      placeholder="例: 80"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">算数</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mathScore">獲得スコア</Label>
                    <Input
                      id="mathScore"
                      type="number"
                      value={formData.mathScore}
                      onChange={(e) => setFormData({ ...formData, mathScore: e.target.value })}
                      min="0"
                      max="100"
                      placeholder="例: 90"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mathPassing">合格点</Label>
                    <Input
                      id="mathPassing"
                      type="number"
                      value={formData.mathPassing}
                      onChange={(e) => setFormData({ ...formData, mathPassing: e.target.value })}
                      min="0"
                      max="100"
                      placeholder="例: 85"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">理科</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scienceScore">獲得スコア</Label>
                    <Input
                      id="scienceScore"
                      type="number"
                      value={formData.scienceScore}
                      onChange={(e) => setFormData({ ...formData, scienceScore: e.target.value })}
                      min="0"
                      max="100"
                      placeholder="例: 88"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sciencePassing">合格点</Label>
                    <Input
                      id="sciencePassing"
                      type="number"
                      value={formData.sciencePassing}
                      onChange={(e) => setFormData({ ...formData, sciencePassing: e.target.value })}
                      min="0"
                      max="100"
                      placeholder="例: 82"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">社会</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="socialScore">獲得スコア</Label>
                    <Input
                      id="socialScore"
                      type="number"
                      value={formData.socialScore}
                      onChange={(e) => setFormData({ ...formData, socialScore: e.target.value })}
                      min="0"
                      max="100"
                      placeholder="例: 87"
                    />
                  </div>
                  <div>
                    <Label htmlFor="socialPassing">合格点</Label>
                    <Input
                      id="socialPassing"
                      type="number"
                      value={formData.socialPassing}
                      onChange={(e) => setFormData({ ...formData, socialPassing: e.target.value })}
                      min="0"
                      max="100"
                      placeholder="例: 83"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseDialog}>
                  キャンセル
                </Button>
                <Button onClick={handleSubmit}>
                  {editingExam ? "更新" : "追加"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(groupedBySchool).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            過去問が登録されていません
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedBySchool)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([schoolName, exams]) => (
              <Card key={schoolName}>
                <CardHeader>
                  <CardTitle>{schoolName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-2 text-left">年</th>
                          <th className="px-4 py-2 text-left">回数</th>
                          <th className="px-4 py-2 text-center">国語</th>
                          <th className="px-4 py-2 text-center">算数</th>
                          <th className="px-4 py-2 text-center">理科</th>
                          <th className="px-4 py-2 text-center">社会</th>
                          <th className="px-4 py-2 text-center">合計点</th>
                          <th className="px-4 py-2 text-center">達成率</th>
                          <th className="px-4 py-2 text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exams
                          .sort((a, b) => {
                            if (b.year !== a.year) return b.year - a.year;
                            return b.examNumber - a.examNumber;
                          })
                          .map((exam) => (
                            <tr key={exam.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-2">{exam.year}</td>
                              <td className="px-4 py-2">第{exam.examNumber}回</td>
                              <td className="px-4 py-2 text-center">
                                {formatScore(exam.japaneseScore, exam.japanesePassing)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {formatScore(exam.mathScore, exam.mathPassing)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {formatScore(exam.scienceScore, exam.sciencePassing)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {formatScore(exam.socialScore, exam.socialPassing)}
                              </td>
                              <td className="px-4 py-2 text-center font-semibold">
                                {(() => {
                                  const total = calculateTotalScore(exam);
                                  const totalPassing = calculateTotalPassing(exam);
                                  if (total === null) return "-";
                                  if (totalPassing !== null) {
                                    return (
                                      <span>
                                        {total} / {totalPassing}
                                      </span>
                                    );
                                  }
                                  return total.toString();
                                })()}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {(() => {
                                  const rate = calculateAchievementRate(exam);
                                  if (rate === null) return "-";
                                  const isPassing = rate >= 100;
                                  return (
                                    <span className={isPassing ? "text-green-600 font-semibold" : "text-orange-600"}>
                                      {rate}%
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex gap-2 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenDialog(exam)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDelete(exam.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}

