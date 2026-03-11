import { Badge } from '@/components/ui/Badge'
import { formatDate, getDueDateLabel } from '@/lib/utils'
import { STATUS_COLORS } from '@/types'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

interface UrgentDeal {
  id: number
  customerName: string
  memberName: string
  status: string
  dueDate: string | null
  nextAction: string | null
}

export function UrgentDealList({ deals }: { deals: UrgentDeal[] }) {
  if (deals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">期日が近い案件はありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {deals.map((deal) => {
        const dueDateInfo = getDueDateLabel(deal.dueDate)
        const isUrgent = dueDateInfo && (dueDateInfo.color.includes('red') || dueDateInfo.color.includes('orange'))
        return (
          <Link
            key={deal.id}
            href={`/deals?highlight=${deal.id}`}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
          >
            {isUrgent && <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-gray-900 truncate">{deal.customerName}</p>
                <Badge className={STATUS_COLORS[deal.status as keyof typeof STATUS_COLORS] ?? 'bg-gray-100 text-gray-700'}>
                  {deal.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{deal.memberName}</p>
              {deal.nextAction && (
                <p className="text-xs text-gray-600 mt-0.5 truncate">→ {deal.nextAction}</p>
              )}
            </div>
            {dueDateInfo && (
              <span className={`text-xs shrink-0 font-medium ${dueDateInfo.color}`}>
                {dueDateInfo.label}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
