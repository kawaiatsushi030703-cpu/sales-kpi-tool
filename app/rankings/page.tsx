'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Header } from '@/components/layout/Header'
import { RankingTable } from '@/components/rankings/RankingTable'
import { Trophy, Zap, Clock, Calendar } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Period = 'monthly' | 'weekly'
type Category = '総合' | '物販' | 'AI'

const PERIOD_CONFIG: Record<Period, { label: string; icon: React.ReactNode; desc: string }> = {
  monthly: { label: '月間', icon: <Calendar size={14} />, desc: '今月の着金合計' },
  weekly: { label: '週間', icon: <Clock size={14} />, desc: '今週の着金 (年間÷52)' },
}

const CATEGORY_CONFIG: Record<Category, { label: string; target: string; color: string; bg: string; border: string }> = {
  総合: { label: '総合', target: '年間10億', color: 'text-indigo-600', bg: 'bg-indigo-600', border: 'border-indigo-600' },
  物販: { label: '物販', target: '年間3億', color: 'text-orange-600', bg: 'bg-orange-500', border: 'border-orange-500' },
  AI:   { label: 'AI',   target: '年間7億', color: 'text-cyan-600',   bg: 'bg-cyan-500',   border: 'border-cyan-500' },
}

export default function RankingsPage() {
  const [period, setPeriod] = useState<Period>('monthly')
  const [category, setCategory] = useState<Category>('総合')

  const { data, isLoading } = useSWR(
    `/api/rankings?period=${period}&category=${category}`,
    fetcher
  )

  const rankings = data?.rankings ?? []
  const teamTotal = data?.teamTotal ?? 0
  const teamTarget = data?.teamTarget ?? 0
  const teamAchievementRate = data?.teamAchievementRate ?? 0

  return (
    <>
      <Header title="着金ランキング" subtitle="チームの競争状況をリアルタイムで確認" />

      <div className="p-3 md:p-6 space-y-5">
        {/* ヘッダーパネル */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={22} className="text-yellow-400" />
            <h2 className="text-white font-bold text-xl">ランキング</h2>
            <Zap size={16} className="text-yellow-400 ml-1" />
          </div>

          {/* 期間タブ */}
          <div className="flex gap-2 mb-4">
            {(Object.entries(PERIOD_CONFIG) as [Period, typeof PERIOD_CONFIG[Period]][]).map(([p, cfg]) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  period === p
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {cfg.icon}
                {cfg.label}
              </button>
            ))}
          </div>

          {/* カテゴリタブ */}
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([c, cfg]) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex flex-col items-start px-4 py-2.5 rounded-xl border-2 transition-all ${
                  category === c
                    ? `${cfg.border} bg-white/15 shadow-lg`
                    : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                }`}
              >
                <span className={`text-sm font-bold ${category === c ? 'text-white' : 'text-slate-300'}`}>
                  {cfg.label}
                </span>
                <span className="text-xs text-slate-400">{cfg.target}</span>
              </button>
            ))}
          </div>

          {/* 選択中の説明 */}
          <p className="text-slate-400 text-xs mt-3">
            {PERIOD_CONFIG[period].desc} ／ {CATEGORY_CONFIG[category].label}カテゴリ
          </p>
        </div>

        {/* ランキング本体 */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <RankingTable
            rankings={rankings}
            teamTotal={teamTotal}
            teamTarget={teamTarget}
            teamAchievementRate={teamAchievementRate}
            period={period}
          />
        )}
      </div>
    </>
  )
}
