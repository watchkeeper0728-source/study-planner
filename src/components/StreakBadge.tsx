import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StreakBadgeProps {
  streak: number
  longestStreak: number
  className?: string
}

export function StreakBadge({ streak, longestStreak, className }: StreakBadgeProps) {
  const getStreakColor = (streak: number) => {
    if (streak === 0) return 'bg-gray-100 text-gray-800'
    if (streak < 7) return 'bg-yellow-100 text-yellow-800'
    if (streak < 30) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className={cn('flex gap-1', className)}>
      <Badge className={cn(getStreakColor(streak))}>
        🔥 {streak}日
      </Badge>
      {longestStreak > streak && (
        <Badge variant="outline" className="text-xs">
          最長: {longestStreak}日
        </Badge>
      )}
    </div>
  )
}




















