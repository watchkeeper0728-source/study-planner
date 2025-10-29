"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Subject, Reflection } from "@prisma/client";
import { getSubjectConfig } from "@/lib/subject";

interface ReflectionsListProps {
  reflections: (Reflection & { test: { name: string; date: Date } })[];
}

export function ReflectionsList({ reflections }: ReflectionsListProps) {
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [selectedSubject, setSelectedSubject] = useState<Subject | "all">("all");

  const subjects: Subject[] = ["MATH", "JAPANESE", "SCIENCE", "SOCIAL"];

  const filteredReflections = reflections
    .filter(reflection => selectedSubject === "all" || reflection.subject === selectedSubject)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return order === "desc" ? dateB - dateA : dateA - dateB;
    });

  const groupedBySubject = subjects.reduce((acc, subject) => {
    acc[subject] = reflections.filter(r => r.subject === subject);
    return acc;
  }, {} as Record<Subject, typeof reflections>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" aria-label="テスト反省一覧">
          テスト反省一覧
        </h2>
        <div className="flex items-center gap-4">
          <Select value={order} onValueChange={(value) => setOrder(value as "desc" | "asc")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">新しい順</SelectItem>
              <SelectItem value="asc">古い順</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">時系列</TabsTrigger>
          <TabsTrigger value="subject">科目別</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedSubject} onValueChange={(value) => setSelectedSubject(value as Subject | "all")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全科目</SelectItem>
                {subjects.map(subject => {
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

          <div className="space-y-4">
            {filteredReflections.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                反省が登録されていません
              </div>
            ) : (
              filteredReflections.map((reflection) => {
                const config = getSubjectConfig(reflection.subject);
                
                return (
                  <Card key={reflection.id} className={config.borderColor}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium">
                          {reflection.test.name}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge className={config.bgColor + " " + config.textColor}>
                            {config.label}
                          </Badge>
                          <Badge variant="outline">
                            {format(new Date(reflection.createdAt), "M/d", { locale: ja })}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {(reflection.score || reflection.deviation) && (
                          <div className="flex gap-4 text-sm">
                            {reflection.score && (
                              <span className="font-medium">点数: {reflection.score}</span>
                            )}
                            {reflection.deviation && (
                              <span className="font-medium">偏差値: {reflection.deviation}</span>
                            )}
                          </div>
                        )}
                        
                        {reflection.approach && (
                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-1">
                              観点①: テストの受け方
                            </div>
                            <div className="text-sm bg-gray-50 p-2 rounded">
                              {reflection.approach}
                            </div>
                          </div>
                        )}
                        
                        {reflection.learning && (
                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-1">
                              観点②: 学習内容
                            </div>
                            <div className="text-sm bg-gray-50 p-2 rounded">
                              {reflection.learning}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="subject" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjects.map((subject) => {
              const config = getSubjectConfig(subject);
              const subjectReflections = groupedBySubject[subject];
              
              return (
                <Card key={subject} className={config.borderColor}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Badge className={config.bgColor + " " + config.textColor}>
                        {config.label}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {subjectReflections.length}件
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {subjectReflections.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">
                          反省がありません
                        </div>
                      ) : (
                        subjectReflections
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((reflection) => (
                            <div key={reflection.id} className="border-l-2 border-gray-200 pl-3">
                              <div className="text-sm font-medium">
                                {reflection.test.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(new Date(reflection.createdAt), "M/d", { locale: ja })}
                              </div>
                              {(reflection.score || reflection.deviation) && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {reflection.score && `点数: ${reflection.score}`}
                                  {reflection.score && reflection.deviation && " / "}
                                  {reflection.deviation && `偏差値: ${reflection.deviation}`}
                                </div>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}