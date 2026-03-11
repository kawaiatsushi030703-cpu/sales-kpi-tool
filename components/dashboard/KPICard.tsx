import { cn, formatCurrency } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { TrendingUp } from 'lucide-react'

interface KPICardProps {
  label: string
  target: number
  payment: number
  achievementRate: number
  period: 'monthly' | 'weekly'
}

export function KPICard({ label, target, payment, achievementRate, period }: KPICardProps) {
  const rateColor =
    achievementRate >= 100 ? 'text-emerald-600' :
    achievementRate >= 70 ? 'text-indigo-600' :
    achievementRate >= 40 ? 'text-yellow-600' : 'text-red-600'

  const bgGradient =
    period === 'monthly'
      ? 'from-indigo-50 to-blue-50 border-indigo-100'
      : 'from-purple-50 to-pink-50 border-purple-100'

  return (
    <div className={cn('bg-gradient-to-br rounded-xl border p-5 space-y-4', bgGradient)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <div className={cn('flex items-center gap-1 text-lg font-bold', rateColor)}>
          <TrendingUp size={18} />
          {achievementRate}%
        </div>
      </div>

      <div>
        <p className="text-3xl font-bold text-gray-900">{formatCurrency(payment)}</p>
        <p className="text-sm text-gray-500 mt-1">目標: {formatCurrency(target)}</p>
      </div>

      <ProgressBar value={achievementRate} />

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <p className="text-gray-500">目標</p>
          <p className="font-semibold text-gray-700">{formatCurrency(target)}</p>
        </div>
        <div>
          <p className="text-gray-500">着金</p>
          <p className="font-semibold text-gray-700">{formatCurrency(payment)}</p>
        </div>
        <div>
          <p className="text-gray-500">残り</p>
          <p className={cn('font-semibold', target - payment > 0 ? 'text-red-600' : 'text-emerald-600')}>
            {formatCurrency(Math.max(0, target - payment))}
          </p>
        </div>
      </div>
    </div>
  )
}
