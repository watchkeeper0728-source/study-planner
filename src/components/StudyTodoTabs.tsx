"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Subject, Todo } from "@prisma/client";
import { getSubjectConfig } from "@/lib/subject";

interface StudyTodoTabsProps {
  todos: Todo[];
  onTodoCreate: (todo: Omit<Todo, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  onTodoUpdate: (id: string, updates: Partial<Todo>) => void;
  onTodoDelete: (id: string) => void;
  onDragStart: (planData: { title: string; start: string; end: string; subject: Subject }) => void;
}

export function StudyTodoTabs({
  todos,
  onTodoCreate,
  onTodoUpdate,
  onTodoDelete,
  onDragStart,
}: StudyTodoTabsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: "",
    notes: "",
    subject: "MATH" as Subject,
    type: "FIXED" as "FIXED" | "RECURRING",
    durationMin: 60,
    priority: 2,
    rrule: null as string | null,
  });

  const subjects: Subject[] = ["MATH", "JAPANESE", "SCIENCE", "SOCIAL"];

  const handleCreateTodo = () => {
    if (newTodo.title.trim()) {
      onTodoCreate(newTodo);
      setNewTodo({
        title: "",
        notes: "",
        subject: "MATH",
        type: "FIXED",
        durationMin: 60,
        priority: 2,
        rrule: null,
      });
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" aria-label="学習ToDo">
            学習ToDo
          </h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" aria-label="新しいToDoを追加">
                <Plus className="h-4 w-4 mr-2" />
                追加
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white text-gray-900">
              <DialogHeader>
                <DialogTitle className="text-gray-900">新しいToDoを作成</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-gray-900">タイトル</Label>
                  <Input
                    id="title"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                    placeholder="例: 算数の問題集を解く"
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="subject" className="text-gray-900">科目</Label>
                  <Select
                    value={newTodo.subject}
                    onValueChange={(value) => setNewTodo({ ...newTodo, subject: value as Subject })}
                  >
                    <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
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
                  <Label htmlFor="type" className="text-gray-900">タイプ</Label>
                  <Select
                    value={newTodo.type}
                    onValueChange={(value) => setNewTodo({ ...newTodo, type: value as "FIXED" | "RECURRING" })}
                  >
                    <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      <SelectItem value="FIXED">固定（単発）</SelectItem>
                      <SelectItem value="RECURRING">定期（繰り返し）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration" className="text-gray-900">時間（分）</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newTodo.durationMin}
                    onChange={(e) => setNewTodo({ ...newTodo, durationMin: parseInt(e.target.value) || 60 })}
                    min="15"
                    max="480"
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="priority" className="text-gray-900">優先度</Label>
                  <Select
                    value={newTodo.priority.toString()}
                    onValueChange={(value) => setNewTodo({ ...newTodo, priority: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      <SelectItem value="1">高</SelectItem>
                      <SelectItem value="2">中</SelectItem>
                      <SelectItem value="3">低</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes" className="text-gray-900">メモ</Label>
                  <Input
                    id="notes"
                    value={newTodo.notes}
                    onChange={(e) => setNewTodo({ ...newTodo, notes: e.target.value })}
                    placeholder="任意のメモ"
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>
                <Button onClick={handleCreateTodo} className="w-full">
                  作成
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="MATH" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            {subjects.map((subject) => {
              const config = getSubjectConfig(subject);
              return (
                <TabsTrigger key={subject} value={subject}>
                  {config.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {subjects.map((subject) => {
            const subjectTodos = todos.filter(todo => todo.subject === subject);
            const config = getSubjectConfig(subject);
            
            return (
              <TabsContent key={subject} value={subject} className="flex-1 overflow-auto">
                <div className="p-4 space-y-3">
                  {subjectTodos.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      {config.label}のToDoはありません
                    </div>
                  ) : (
                    subjectTodos.map((todo) => (
                      <Card
                        key={todo.id}
                        className={`cursor-move hover:shadow-md transition-shadow ${config.borderColor}`}
                        draggable={true}
                        onDragStart={(e) => {
                          // ドラッグデータを転送
                          const dragData = {
                            title: todo.title,
                            duration: todo.durationMin,
                            subject: todo.subject,
                          };
                          e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        aria-label={`${todo.title} - ${config.label}`}
                      >
                        <CardHeader className="pb-2 py-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-xs font-medium">
                              {todo.title}
                            </CardTitle>
                            <Badge variant="outline" className={`${config.borderColor} text-xs px-2 py-0`}>
                              {config.label}
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}