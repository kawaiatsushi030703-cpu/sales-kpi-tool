import { Badge } from '@/components/ui/Badge'
import { STATUS_COLORS, DealStatus } from '@/types'

export function DealStatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status as DealStatus] ?? 'bg-gray-100 text-gray-700'
  return <Badge className={colorClass}>{status}</Badge>
}
