import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number // 0-100
  className?: string
  showLabel?: boolean
  color?: 'indigo' | 'green' | 'yellow' | 'red'
}

const colors = {
  indigo: 'bg-indigo-500',
  green: 'bg-emerald-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
}

export function ProgressBar({ value, className, showLabel = false, color = 'indigo' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const barColor = value >= 100 ? 'bg-emerald-500' : value >= 70 ? colors[color] : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-right text-xs text-gray-500 mt-0.5">{value}%</p>
      )}
    </div>
  )
}
