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
import { Calendar, Clock } from 'lucide-react'

interface TaskEditorProps {
  task?: any
  isOpen: boolean
  onClose: () => void
  onSave: (task: any) => void
}

export function TaskEditor({ task, isOpen, onClose, onSave }: TaskEditorProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    due: '',
    notifyMinutes: 30,
    calendarOn: false,
  })

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'MEDIUM',
        due: task.due ? new Date(task.due).toISOString().slice(0, 16) : '',
        notifyMinutes: task.notifyMinutes || 30,
        calendarOn: task.calendarOn || false,
      })
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        due: '',
        notifyMinutes: 30,
        calendarOn: false,
      })
    }
  }, [task])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {task ? 'タスクを編集' : '新しいタスク'}
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
                placeholder="タスクのタイトルを入力"
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
              <Label htmlFor="priority">優先度</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">低</SelectItem>
                  <SelectItem value="MEDIUM">中</SelectItem>
                  <SelectItem value="HIGH">高</SelectItem>
                  <SelectItem value="URGENT">緊急</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="due">期限</Label>
              <Input
                id="due"
                type="datetime-local"
                value={formData.due}
                onChange={(e) => setFormData({ ...formData, due: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="notifyMinutes">通知タイミング</Label>
              <Select
                value={formData.notifyMinutes.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, notifyMinutes: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">期限の時</SelectItem>
                  <SelectItem value="5">5分前</SelectItem>
                  <SelectItem value="15">15分前</SelectItem>
                  <SelectItem value="30">30分前</SelectItem>
                  <SelectItem value="60">1時間前</SelectItem>
                  <SelectItem value="120">2時間前</SelectItem>
                  <SelectItem value="1440">1日前</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="calendarOn"
                checked={formData.calendarOn}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, calendarOn: !!checked })
                }
              />
              <Label htmlFor="calendarOn">Google Calendarに追加</Label>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">
              {task ? '更新' : '作成'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}













