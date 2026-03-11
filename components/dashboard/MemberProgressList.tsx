import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatCurrency } from '@/lib/utils'
import { MemberWithStats } from '@/types'
import Link from 'next/link'

interface Props {
  members: MemberWithStats[]
}

export function MemberProgressList({ members }: Props) {
  const sorted = [...members].sort((a, b) => b.paymentAmount - a.paymentAmount)

  return (
    <div className="space-y-3">
      {sorted.map((member, index) => (
        <Link
          key={member.id}
          href={`/members/${member.id}`}
          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          {/* 順位 */}
          <span className="w-5 text-sm font-bold text-gray-400">{index + 1}</span>

          {/* アバター */}
          <Avatar name={member.name} color={member.avatarColor} size="sm" />

          {/* 名前・進捗 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600">
                {member.name}
              </p>
              <span className="text-xs font-bold text-gray-600 ml-2 shrink-0">
                {member.achievementRate}%
              </span>
            </div>
            <ProgressBar value={member.achievementRate} />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{formatCurrency(member.paymentAmount)}</span>
              <span>/ {formatCurrency(member.targetAmount)}</span>
            </div>
          </div>

          {/* 案件数 */}
          <div className="text-center shrink-0">
            <p className="text-lg font-bold text-gray-700">{member.dealCount}</p>
            <p className="text-xs text-gray-400">案件</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
