import { describe, it, expect } from 'vitest'
import { isPast, isToday, isTomorrow } from 'date-fns'

// Mock task status calculation
function getTaskStatus(task: any) {
  if (!task.due) return 'no-due'
  if (isPast(task.due)) return 'overdue'
  if (isToday(task.due)) return 'today'
  if (isTomorrow(task.due)) return 'tomorrow'
  return 'upcoming'
}

// Mock task sorting
function sortTasks(tasks: any[]) {
  return tasks.sort((a, b) => {
    // First by done status
    if (a.done !== b.done) {
      return a.done ? 1 : -1
    }
    
    // Then by priority
    const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }
    
    // Finally by due date
    if (!a.due && !b.due) return 0
    if (!a.due) return 1
    if (!b.due) return -1
    
    return new Date(a.due).getTime() - new Date(b.due).getTime()
  })
}

describe('Task Logic', () => {
  describe('Task Status', () => {
    it('should identify overdue tasks', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const task = { due: yesterday }
      const status = getTaskStatus(task)
      expect(status).toBe('overdue')
    })

    it('should identify today tasks', () => {
      const today = new Date()
      const task = { due: today }
      const status = getTaskStatus(task)
      expect(status).toBe('today')
    })

    it('should identify tomorrow tasks', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const task = { due: tomorrow }
      const status = getTaskStatus(task)
      expect(status).toBe('tomorrow')
    })

    it('should identify upcoming tasks', () => {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      
      const task = { due: nextWeek }
      const status = getTaskStatus(task)
      expect(status).toBe('upcoming')
    })

    it('should handle tasks without due date', () => {
      const task = {}
      const status = getTaskStatus(task)
      expect(status).toBe('no-due')
    })
  })

  describe('Task Sorting', () => {
    it('should sort by done status first', () => {
      const tasks = [
        { id: 1, done: true, priority: 'HIGH', due: new Date() },
        { id: 2, done: false, priority: 'LOW', due: new Date() },
      ]
      
      const sorted = sortTasks(tasks)
      expect(sorted[0].id).toBe(2) // Not done first
      expect(sorted[1].id).toBe(1) // Done second
    })

    it('should sort by priority when done status is same', () => {
      const tasks = [
        { id: 1, done: false, priority: 'LOW', due: new Date() },
        { id: 2, done: false, priority: 'URGENT', due: new Date() },
        { id: 3, done: false, priority: 'MEDIUM', due: new Date() },
      ]
      
      const sorted = sortTasks(tasks)
      expect(sorted[0].id).toBe(2) // URGENT first
      expect(sorted[1].id).toBe(3) // MEDIUM second
      expect(sorted[2].id).toBe(1) // LOW last
    })

    it('should sort by due date when priority is same', () => {
      const today = new Date()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const tasks = [
        { id: 1, done: false, priority: 'MEDIUM', due: tomorrow },
        { id: 2, done: false, priority: 'MEDIUM', due: today },
      ]
      
      const sorted = sortTasks(tasks)
      expect(sorted[0].id).toBe(2) // Today first
      expect(sorted[1].id).toBe(1) // Tomorrow second
    })

    it('should handle tasks without due dates', () => {
      const tasks = [
        { id: 1, done: false, priority: 'MEDIUM', due: null },
        { id: 2, done: false, priority: 'MEDIUM', due: new Date() },
      ]
      
      const sorted = sortTasks(tasks)
      expect(sorted[0].id).toBe(2) // With due date first
      expect(sorted[1].id).toBe(1) // Without due date last
    })
  })
})











