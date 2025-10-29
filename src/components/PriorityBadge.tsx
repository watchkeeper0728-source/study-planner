import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PriorityBadgeProps {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const variants = {
    LOW: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    MEDIUM: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    HIGH: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    URGENT: 'bg-red-100 text-red-800 hover:bg-red-200',
  }

  const labels = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    URGENT: '緊急',
  }

  return (
    <Badge className={cn(variants[priority], className)}>
      {labels[priority]}
    </Badge>
  )
}













