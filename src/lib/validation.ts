import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内で入力してください'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  due: z.string().datetime().optional(),
  notifyMinutes: z.number().int().min(0).max(1440).default(30),
  calendarOn: z.boolean().default(false),
})

export const habitSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内で入力してください'),
  description: z.string().optional(),
  schedule: z.string().min(1, 'スケジュールは必須です'),
  notifyAt: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '時刻はHH:MM形式で入力してください').optional(),
})

export const taskUpdateSchema = taskSchema.partial()

export const habitUpdateSchema = habitSchema.partial()

export type TaskInput = z.infer<typeof taskSchema>
export type HabitInput = z.infer<typeof habitSchema>
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>
export type HabitUpdateInput = z.infer<typeof habitUpdateSchema>




















