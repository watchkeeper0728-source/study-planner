'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PriorityBadge } from '@/components/PriorityBadge'
import { Calendar, Clock, Trash2, Edit } from 'lucide-react'
import { format, isToday, isPast, isTomorrow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface TaskItemProps {
  task: {
    id: string
    title: string
    description?: string
    done: boolean
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    due?: Date
    notifyMinutes: number
    calendarOn: boolean
    createdAt: Date
    updatedAt: Date
  }
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onEdit: (task: any) => void
}

export function TaskItem({ task, onToggle, onDelete, onEdit }: TaskItemProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleToggle = async () => {
    setIsUpdating(true)
    try {
      await onToggle(task.id, !task.done)
    } finally {
      setIsUpdating(false)
    }
  }

  const getDueDateColor = () => {
    if (!task.due) return ''
    if (isPast(task.due)) return 'text-red-600'
    if (isToday(task.due)) return 'text-orange-600'
    if (isTomorrow(task.due)) return 'text-blue-600'
    return 'text-gray-600'
  }

  const getDueDateText = () => {
    if (!task.due) return null
    if (isPast(task.due)) return '期限切れ'
    if (isToday(task.due)) return '今日'
    if (isTomorrow(task.due)) return '明日'
    return format(task.due, 'M月d日', { locale: ja })
  }

  return (
    <Card className={`transition-all ${task.done ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Checkbox
              checked={task.done}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
              className="mt-1"
            />
            <div className="flex-1">
              <CardTitle className={`text-lg ${task.done ? 'line-through' : ''}`}>
                {task.title}
              </CardTitle>
              {task.description && (
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {task.due && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className={getDueDateColor()}>
                {getDueDateText()} {format(task.due, 'HH:mm')}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{task.notifyMinutes}分前に通知</span>
          </div>
          {task.calendarOn && (
            <Badge variant="outline" className="text-xs">
              Google Calendar
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}






