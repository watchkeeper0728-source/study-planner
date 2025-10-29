import { z } from "zod";
import { Subject } from "@prisma/client";

export const todoSchema = z.object({
  subject: z.nativeEnum(Subject),
  title: z.string().min(1, "タイトルは必須です").max(100, "タイトルは100文字以内で入力してください"),
  notes: z.string().nullable().optional(),
  type: z.enum(["FIXED", "RECURRING"]),
  rrule: z.string().nullable().optional(),
  durationMin: z.number().min(15, "15分以上で設定してください").max(480, "8時間以内で設定してください"),
  priority: z.number().min(1).max(3),
});

export const planSchema = z.object({
  todoId: z.string().optional(),
  subject: z.nativeEnum(Subject),
  title: z.string().min(1, "タイトルは必須です"),
  start: z.string().datetime("開始時刻の形式が正しくありません"),
  end: z.string().datetime("終了時刻の形式が正しくありません"),
});

export const studyLogSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(100, "タイトルは100文字以内で入力してください"),
  date: z.string().datetime("日付の形式が正しくありません"),
  subject: z.nativeEnum(Subject),
  minutes: z.number().min(1, "1分以上で入力してください").max(480, "8時間以内で入力してください"),
  comment: z.string().optional(),
  planId: z.string().optional(),
});

export const testSchema = z.object({
  name: z.string().min(1, "テスト名は必須です").max(100, "テスト名は100文字以内で入力してください"),
  date: z.string().datetime("日付の形式が正しくありません"),
});

export const reflectionSchema = z.object({
  testId: z.string(),
  subject: z.nativeEnum(Subject),
  score: z.number().min(0).max(100).optional(),
  deviation: z.number().min(0).max(100).optional(),
  approach: z.string().optional(),
  learning: z.string().optional(),
});

export const pastExamSchema = z.object({
  schoolName: z.string().min(1, "学校名は必須です").max(100, "学校名は100文字以内で入力してください"),
  year: z.number().min(2000).max(2100),
  examNumber: z.number().min(1).max(10),
  mathScore: z.number().min(0).max(100).optional(),
  mathPassing: z.number().min(0).max(100).optional(),
  japaneseScore: z.number().min(0).max(100).optional(),
  japanesePassing: z.number().min(0).max(100).optional(),
  scienceScore: z.number().min(0).max(100).optional(),
  sciencePassing: z.number().min(0).max(100).optional(),
  socialScore: z.number().min(0).max(100).optional(),
  socialPassing: z.number().min(0).max(100).optional(),
});

export type TodoInput = z.infer<typeof todoSchema>;
export type PlanInput = z.infer<typeof planSchema>;
export type StudyLogInput = z.infer<typeof studyLogSchema>;
export type TestInput = z.infer<typeof testSchema>;
export type ReflectionInput = z.infer<typeof reflectionSchema>;
export type PastExamInput = z.infer<typeof pastExamSchema>;