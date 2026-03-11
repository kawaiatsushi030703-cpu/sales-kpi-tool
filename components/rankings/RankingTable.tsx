import { Avatar } from '@/components/ui/Avatar'
import { formatCurrency } from '@/lib/utils'
import { Trophy, Medal, Flame } from 'lucide-react'

interface RankingEntry {
  rank: number
  memberId: number
  memberName: string
  avatarColor: string
  category: string
  paymentAmount: number
  targetAmount: number
  achievementRate: number
  gapToNext: number
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 flex items-center justify-center shadow-md shrink-0">
      <Trophy size={16} className="text-yellow-900" />
    </div>
  )
  if (rank === 2) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-b from-gray-300 to-gray-400 flex items-center justify-center shadow-sm shrink-0">
      <Medal size={16} className="text-gray-700" />
    </div>
  )
  if (rank === 3) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center shadow-sm shrink-0">
      <Medal size={16} className="text-amber-900" />
    </div>
  )
  return (
    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
      <span className="font-game text-gray-400 text-sm">{rank}</span>
    </div>
  )
}

export function RankingTable({ rankings, teamTotal, teamTarget, teamAchievementRate }: {
  rankings: RankingEntry[]
  teamTotal: number
  teamTarget: number
  teamAchievementRate: number
}) {
  if (!rankings || rankings.length === 0) {
    return <p className="text-center text-gray-400 py-8">データがありません</p>
  }

  const leader = rankings[0]

  return (
    <div className="space-y-3">
      {/* チーム合計 */}
      <div className="bg-gray-900 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs">チーム合計</p>
          <p className="font-game text-white text-xl mt-0.5">{formatCurrency(teamTotal)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">目標</p>
          <p className="text-gray-300 text-sm font-semibold">{formatCurrency(teamTarget)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">達成率</p>
          <p className={`font-game text-xl ${teamAchievementRate >= 100 ? 'text-emerald-400' : teamAchievementRate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
            {teamAchievementRate}%
          </p>
        </div>
      </div>

      {/* ランキング */}
      {rankings.map((entry) => {
        const isFirst = entry.rank === 1
        const gap = leader.paymentAmount - entry.paymentAmount

        return (
          <div key={entry.memberId} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${
            isFirst
              ? 'bg-yellow-50 border-yellow-200 shadow-sm'
              : entry.rank === 2
              ? 'bg-gray-50 border-gray-200'
              : entry.rank === 3
              ? 'bg-amber-50 border-amber-100'
              : 'bg-white border-gray-100 hover:bg-gray-50'
          }`}>
            <RankBadge rank={entry.rank} />

            <Avatar name={entry.memberName} color={entry.avatarColor} size={isFirst ? 'lg' : 'md'} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-semibold text-gray-900 ${isFirst ? 'text-base' : 'text-sm'}`}>
                  {entry.memberName}
                </p>
                {isFirst && <Flame size={14} className="text-orange-500" />}
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{entry.category}</span>
              </div>
              {!isFirst && gap > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">1位まで {formatCurrency(gap)}</p>
              )}
            </div>

            {/* 着金額のみ */}
            <p className={`font-game tabular-nums ${isFirst ? 'text-2xl text-gray-900' : 'text-lg text-gray-700'}`}>
              {formatCurrency(entry.paymentAmount)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
