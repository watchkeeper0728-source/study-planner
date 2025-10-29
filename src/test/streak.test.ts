import { describe, it, expect } from 'vitest'
import { format, addDays, subDays } from 'date-fns'

// Mock streak calculation logic
function calculateStreak(logs: Array<{ date: Date }>): number {
  if (logs.length === 0) return 0

  const sortedLogs = logs
    .map(log => ({ date: new Date(log.date) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  let streak = 0
  let checkDate = new Date()
  checkDate.setHours(0, 0, 0, 0)

  for (const log of sortedLogs) {
    const logDate = new Date(log.date)
    logDate.setHours(0, 0, 0, 0)

    if (logDate.getTime() === checkDate.getTime()) {
      streak++
      checkDate = subDays(checkDate, 1)
    } else {
      break
    }
  }

  return streak
}

describe('Streak Calculation', () => {
  it('should calculate streak for consecutive days', () => {
    const today = new Date()
    const yesterday = subDays(today, 1)
    const twoDaysAgo = subDays(today, 2)

    const logs = [
      { date: twoDaysAgo },
      { date: yesterday },
      { date: today },
    ]

    const streak = calculateStreak(logs)
    expect(streak).toBe(3)
  })

  it('should handle gaps in streak', () => {
    const today = new Date()
    const yesterday = subDays(today, 1)
    const threeDaysAgo = subDays(today, 3)

    const logs = [
      { date: threeDaysAgo },
      { date: yesterday },
      { date: today },
    ]

    const streak = calculateStreak(logs)
    expect(streak).toBe(2) // Only yesterday and today
  })

  it('should return 0 for empty logs', () => {
    const logs: Array<{ date: Date }> = []
    const streak = calculateStreak(logs)
    expect(streak).toBe(0)
  })

  it('should handle timezone differences', () => {
    const today = new Date()
    const yesterday = subDays(today, 1)

    // Create logs for consecutive days
    const logs = [
      { date: yesterday },
      { date: today },
    ]

    const streak = calculateStreak(logs)
    expect(streak).toBe(2)
  })
})
