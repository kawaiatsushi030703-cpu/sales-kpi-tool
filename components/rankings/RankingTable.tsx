import { formatCurrency } from '@/lib/utils'

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

function rateColor(r: number) {
  if (r >= 100) return { bar: 'from-emerald-400 to-emerald-500', text: 'text-emerald-500' }
  if (r >= 70)  return { bar: 'from-amber-400 to-amber-500',    text: 'text-amber-500'   }
  return              { bar: 'from-red-400 to-red-500',          text: 'text-red-500'     }
}

export function RankingTable({ rankings, teamTotal, teamTarget, teamAchievementRate }: {
  rankings: RankingEntry[]
  teamTotal: number
  teamTarget: number
  teamAchievementRate: number
  period?: string
}) {
  if (!rankings || rankings.length === 0) {
    return <p className="text-center text-gray-400 py-8">データがありません</p>
  }

  const clr = rateColor(teamAchievementRate)
  const barPct = Math.min(teamAchievementRate, 100)
  const remaining = Math.max(0, teamTarget - teamTotal)

  return (
    <div className="space-y-3">

      {/* チーム合計 */}
      <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Team Total</p>
            <p className={`font-bold leading-none text-4xl ${clr.text}`}>{formatCurrency(teamTotal)}</p>
          </div>
          <p className={`font-bold text-5xl leading-none ${clr.text}`}>
            {teamAchievementRate}<span className="text-2xl">%</span>
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="relative h-5 bg-gray-700 rounded-full overflow-hidden">
            {[25, 50, 75].map(p => (
              <div key={p} className="absolute top-0 bottom-0 w-px bg-gray-600 z-10" style={{ left: `${p}%` }} />
            ))}
            <div className={`h-full rounded-full bg-gradient-to-r ${clr.bar} transition-all duration-700 relative`}
              style={{ width: `${barPct}%` }}>
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>¥0</span>
            <span className="text-gray-400">{remaining > 0 ? `残り ${formatCurrency(remaining)}` : '目標達成！'}</span>
            <span>{formatCurrency(teamTarget)}</span>
          </div>
        </div>

        {/* チーム別内訳 */}
        {(() => {
          const TEAMS = [
            { color: '#3b82f6', label: '青' },
            { color: '#f59e0b', label: '黄' },
            { color: '#ef4444', label: '赤' },
          ]
          const teamTotals = TEAMS.map(t => ({
            ...t,
            amount: rankings.filter(r => r.avatarColor === t.color).reduce((s, r) => s + r.paymentAmount, 0),
          })).filter(t => t.amount > 0)

          return teamTotals.length > 0 ? (
            <div className="space-y-1">
              <p className="text-gray-500 text-xs uppercase tracking-wider">チーム別内訳</p>
              <div className="relative h-3 rounded-full overflow-hidden bg-gray-700 flex">
                {teamTotals.map(t => (
                  <div key={t.color} className="h-full"
                    style={{ width: `${teamTotal > 0 ? (t.amount / teamTotal) * 100 : 0}%`, background: t.color }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                {teamTotals.map(t => (
                  <span key={t.color} className="text-xs text-gray-400">
                    {t.label}: {formatCurrency(t.amount)}
                  </span>
                ))}
              </div>
            </div>
          ) : null
        })()}
      </div>

      {/* ランキング行（アイコン一切なし） */}
      {rankings.map((entry) => {
        const isFirst = entry.rank === 1
        const gap = rankings[0].paymentAmount - entry.paymentAmount
        const memberPct = Math.min(entry.achievementRate, 100)
        const mClr = rateColor(entry.achievementRate)

        return (
          <div
            key={entry.memberId}
            className={`px-5 py-4 rounded-xl border-2 transition-all ${
              isFirst
                ? 'border-yellow-400 shadow-lg'
                : 'bg-white border-gray-100 hover:bg-gray-50'
            }`}
            style={isFirst ? {
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #fffbeb 100%)',
            } : {}}
          >
            <div className="flex items-center gap-4 mb-3">
              {/* 順位（数字のみ） */}
              <div className={`shrink-0 text-center ${isFirst ? 'w-10' : 'w-9'}`}>
                <span className={`font-black leading-none ${
                  isFirst ? 'text-4xl text-yellow-600' : 'text-xl text-gray-400'
                }`}>{entry.rank}</span>
              </div>

              {/* 名前のみ */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold truncate ${isFirst ? 'text-xl text-gray-900' : 'text-base text-gray-800'}`}>
                  {entry.memberName}
                </p>
                {!isFirst && gap > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">1位まで {formatCurrency(gap)}</p>
                )}
              </div>

              {/* 着金額・達成率 */}
              <div className="text-right shrink-0">
                <p className={`font-bold tabular-nums ${isFirst ? 'text-2xl text-gray-900' : 'text-lg text-gray-700'}`}>
                  {formatCurrency(entry.paymentAmount)}
                </p>
                <p className={`text-xs font-bold mt-0.5 ${mClr.text}`}>{entry.achievementRate}%</p>
              </div>
            </div>

            {/* 進捗バー */}
            <div className={`relative h-2.5 rounded-full overflow-hidden ${isFirst ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              {[25, 50, 75].map(p => (
                <div key={p} className={`absolute top-0 bottom-0 w-px z-10 ${isFirst ? 'bg-yellow-200' : 'bg-gray-200'}`}
                  style={{ left: `${p}%` }} />
              ))}
              <div className={`h-full rounded-full bg-gradient-to-r ${mClr.bar} transition-all duration-700`}
                style={{ width: `${memberPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatCurrency(entry.paymentAmount)}</span>
              <span>目標 {formatCurrency(entry.targetAmount)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
