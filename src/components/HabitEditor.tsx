'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface HabitEditorProps {
  habit?: any
  isOpen: boolean
  onClose: () => void
  onSave: (habit: any) => void
}

const DAYS = [
  { value: 'monday', label: '月曜日' },
  { value: 'tuesday', label: '火曜日' },
  { value: 'wednesday', label: '水曜日' },
  { value: 'thursday', label: '木曜日' },
  { value: 'friday', label: '金曜日' },
  { value: 'saturday', label: '土曜日' },
  { value: 'sunday', label: '日曜日' },
]

export function HabitEditor({ habit, isOpen, onClose, onSave }: HabitEditorProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    schedule: [] as string[],
    notifyAt: '',
  })

  useEffect(() => {
    if (habit) {
      setFormData({
        title: habit.title || '',
        description: habit.description || '',
        schedule: habit.schedule ? habit.schedule.split(',') : [],
        notifyAt: habit.notifyAt || '',
      })
    } else {
      setFormData({
        title: '',
        description: '',
        schedule: [],
        notifyAt: '',
      })
    }
  }, [habit])

  const handleDayChange = (day: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        schedule: [...formData.schedule, day],
      })
    } else {
      setFormData({
        ...formData,
        schedule: formData.schedule.filter(d => d !== day),
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.schedule.length === 0) {
      alert('少なくとも1つの曜日を選択してください')
      return
    }
    
    const habitData = {
      ...formData,
      schedule: formData.schedule.join(','),
    }
    onSave(habitData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {habit ? '習慣を編集' : '新しい習慣'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="習慣のタイトルを入力"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">説明</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="詳細な説明（任意）"
              />
            </div>

            <div>
              <Label>実行する曜日 *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {DAYS.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.value}
                      checked={formData.schedule.includes(day.value)}
                      onCheckedChange={(checked) =>
                        handleDayChange(day.value, !!checked)
                      }
                    />
                    <Label htmlFor={day.value} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notifyAt">通知時刻</Label>
              <Input
                id="notifyAt"
                type="time"
                value={formData.notifyAt}
                onChange={(e) => setFormData({ ...formData, notifyAt: e.target.value })}
                placeholder="HH:MM"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">
              {habit ? '更新' : '作成'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}














