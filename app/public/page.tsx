'use client'
import useSWR from 'swr'
import { formatCurrency } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const MEDALS = ['🥇', '🥈', '🥉']

function rateColor(r: number) {
  if (r >= 100) return { text: 'text-emerald-400', bar: '#10b981', badge: 'bg-emerald-900 text-emerald-300 border-emerald-700', label: '✅ 達成済み' }
  if (r >= 80)  return { text: 'text-blue-400',    bar: '#60a5fa', badge: 'bg-blue-900 text-blue-300 border-blue-700',       label: '👍 順調' }
  if (r >= 50)  return { text: 'text-amber-400',   bar: '#f59e0b', badge: 'bg-amber-900 text-amber-300 border-amber-700',   label: '⚠️ 要注意' }
  return              { text: 'text-red-400',      bar: '#ef4444', badge: 'bg-red-900 text-red-300 border-red-700',         label: '🚨 危機' }
}

export default function PublicPage() {
  const { data, isLoading } = useSWR('/api/dashboard', fetcher, { refreshInterval: 60000 })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  const annual = data?.annual
  const monthly = data?.monthly
  const members = [...(data?.members ?? [])].sort((a: any, b: any) => b.paymentAmount - a.paymentAmount)
  const annualRate = annual ? Math.round((annual.payment / annual.target) * 100) : 0

  return (
    <div className="font-sans">

      {/* ヒーローセクション */}
      <section className="relative overflow-hidden px-6 py-20 text-center"
        style={{ background: 'linear-gradient(160deg, #0f0a00 0%, #1c1400 50%, #0f0a00 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, #fbbf24 0%, transparent 70%)' }} />

        <div className="relative max-w-3xl mx-auto">
          <p className="text-yellow-600 text-sm font-bold tracking-widest uppercase mb-4">Cチーム 売上実績</p>

          <h1 className="text-5xl md:text-7xl font-black mb-2"
            style={{ background: 'linear-gradient(90deg, #fbbf24, #fde68a, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            年間目標<br />10億円
          </h1>

          <div className="mt-8 mb-6">
            <p className="text-gray-400 text-sm mb-2">年間達成率</p>
            <p className={`text-7xl font-black ${rateColor(annualRate).text}`}>{annualRate}<span className="text-4xl">%</span></p>
          </div>

          {/* 年間プログレスバー */}
          <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden max-w-xl mx-auto mb-4">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(annualRate, 100)}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
          </div>

          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <p className="text-gray-500">累計着金</p>
              <p className="text-yellow-300 font-bold text-lg">{formatCurrency(annual?.payment ?? 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">残り</p>
              <p className="text-gray-300 font-bold text-lg">{formatCurrency(Math.max(0, (annual?.target ?? 0) - (annual?.payment ?? 0)))}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 月間KPIセクション */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-center text-gray-400 text-xs tracking-widest uppercase mb-8">
          {new Date().getFullYear()}年{new Date().getMonth() + 1}月 月間実績
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: '物販', color: '#fb923c', data: monthly?.buhan },
            { label: 'AI',   color: '#22d3ee', data: monthly?.ai },
          ].map(({ label, color, data: d }) => {
            const rate = d?.achievementRate ?? 0
            const clr = rateColor(rate)
            return (
              <div key={label} className="rounded-2xl p-6 bg-gray-900 border border-gray-800"
                style={{ borderTop: `4px solid ${color}` }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xl font-black" style={{ color }}>{label}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${clr.badge}`}>{clr.label}</span>
                </div>

                <p className={`text-6xl font-black mb-4 ${clr.text}`}>
                  {rate}<span className="text-3xl">%</span>
                </p>

                <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-4">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(rate, 100)}%`, background: color }} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-gray-800 rounded-lg p-2 text-center">
                    <p className="text-gray-500 text-xs">目標</p>
                    <p className="text-gray-300 font-bold text-xs mt-0.5">{formatCurrency(d?.target ?? 0)}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2 text-center">
                    <p className="text-gray-500 text-xs">着金</p>
                    <p className="text-white font-bold text-xs mt-0.5">{formatCurrency(d?.payment ?? 0)}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2 text-center">
                    <p className="text-gray-500 text-xs">残り</p>
                    <p className={`font-bold text-xs mt-0.5 ${(d?.payment ?? 0) >= (d?.target ?? 0) ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(d?.payment ?? 0) >= (d?.target ?? 0) ? '達成！' : formatCurrency(Math.max(0, (d?.target ?? 0) - (d?.payment ?? 0)))}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* メンバーランキングセクション */}
      <section className="px-6 py-16 bg-gray-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-gray-400 text-xs tracking-widest uppercase mb-8">メンバーランキング</h2>

          <div className="space-y-3">
            {members.map((member: any, index: number) => {
              const clr = rateColor(member.achievementRate)
              return (
                <div key={member.id} className={`flex items-center gap-4 p-4 rounded-xl border ${
                  index === 0 ? 'bg-yellow-950 border-yellow-800' :
                  index === 1 ? 'bg-gray-800 border-gray-700' :
                  index === 2 ? 'bg-orange-950 border-orange-900' :
                  'bg-gray-900 border-gray-800'
                }`}>
                  <span className="text-2xl w-8 text-center shrink-0">
                    {index < 3 ? MEDALS[index] : <span className="text-gray-600 font-bold text-sm">{index + 1}</span>}
                  </span>

                  {/* アバター */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: member.avatarColor }}>
                    {member.name[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-bold text-white truncate">{member.name}</p>
                      <span className={`text-lg font-black ml-2 shrink-0 ${clr.text}`}>
                        {member.achievementRate}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(member.achievementRate, 100)}%`, background: clr.bar }} />
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="text-gray-400">着金: <span className="text-gray-200">{formatCurrency(member.paymentAmount)}</span></span>
                      <span className="text-gray-600">目標: {formatCurrency(member.targetAmount)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="text-center py-8 text-gray-700 text-xs">
        自動更新 · {new Date().toLocaleDateString('ja-JP')}
      </footer>
    </div>
  )
}
