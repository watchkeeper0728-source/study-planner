'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StreakBadge } from '@/components/StreakBadge'
import { CheckCircle, Clock, Edit, Trash2 } from 'lucide-react'
import { format, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'

interface HabitCardProps {
  habit: {
    id: string
    title: string
    description?: string
    schedule: string
    notifyAt?: string
    streak: number
    longestStreak: number
    logs: Array<{ date: Date }>
  }
  onDone: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (habit: any) => void
}

export function HabitCard({ habit, onDone, onDelete, onEdit }: HabitCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleDone = async () => {
    setIsUpdating(true)
    try {
      await onDone(habit.id)
    } finally {
      setIsUpdating(false)
    }
  }

  const isDoneToday = habit.logs.some(log => isToday(log.date))
  const scheduleDays = habit.schedule.split(',').map(day => day.trim())

  const getScheduleText = () => {
    const dayNames = {
      monday: '月',
      tuesday: '火',
      wednesday: '水',
      thursday: '木',
      friday: '金',
      saturday: '土',
      sunday: '日',
    }
    return scheduleDays.map(day => dayNames[day as keyof typeof dayNames] || day).join(' ')
  }

  return (
    <Card className={`transition-all ${isDoneToday ? 'bg-green-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{habit.title}</CardTitle>
            {habit.description && (
              <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(habit)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(habit.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <StreakBadge streak={habit.streak} longestStreak={habit.longestStreak} />
            <Button
              onClick={handleDone}
              disabled={isUpdating || isDoneToday}
              className={`${
                isDoneToday
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              size="sm"
            >
              {isDoneToday ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  完了済み
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  達成
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{getScheduleText()}</span>
            </div>
            {habit.notifyAt && (
              <Badge variant="outline" className="text-xs">
                通知: {habit.notifyAt}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}













