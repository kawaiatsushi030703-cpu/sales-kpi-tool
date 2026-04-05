'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Header } from '@/components/layout/Header'
import { RankingTable } from '@/components/rankings/RankingTable'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Period = 'monthly' | 'weekly'
type Category = '総合' | '物販' | 'AI'

const PERIOD_CONFIG: Record<Period, { label: string }> = {
  monthly: { label: '月間' },
  weekly:  { label: '週間' },
}

const CATEGORY_CONFIG: Record<Category, { label: string; target: string; border: string }> = {
  総合: { label: '総合', target: '年間10億', border: 'border-indigo-600' },
  物販: { label: '物販', target: '年間3億',  border: 'border-orange-500' },
  AI:   { label: 'AI',   target: '年間7億',  border: 'border-cyan-500'   },
}

const now = new Date()

function addMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

function prevWeek(year: number, month: number, week: number) {
  if (week > 1) return { year, month, week: week - 1 }
  const prev = addMonth(year, month, -1)
  return { ...prev, week: 4 }
}

function nextWeek(year: number, month: number, week: number) {
  if (week < 4) return { year, month, week: week + 1 }
  const next = addMonth(year, month, 1)
  return { ...next, week: 1 }
}

function isCurrentMonth(year: number, month: number) {
  return year === now.getFullYear() && month === now.getMonth() + 1
}

function isCurrentWeek(year: number, month: number, week: number) {
  const currentWeek = Math.ceil(now.getDate() / 7)
  return isCurrentMonth(year, month) && week === currentWeek
}

export default function RankingsPage() {
  const [period, setPeriod] = useState<Period>('monthly')
  const [category, setCategory] = useState<Category>('総合')
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  const availableCategories = period === 'weekly'
    ? (Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).filter(([c]) => c !== '総合')
    : (Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][])

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [week, setWeek] = useState(Math.ceil(now.getDate() / 7))

  const handlePeriodChange = (p: Period) => {
    setPeriod(p)
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
    setWeek(Math.ceil(now.getDate() / 7))
    if (p === 'weekly' && category === '総合') setCategory('物販')
  }

  const apiUrl = period === 'weekly'
    ? `/api/rankings?period=weekly&category=${category}&year=${year}&month=${month}&week=${week}`
    : `/api/rankings?period=monthly&category=${category}&year=${year}&month=${month}`

  const { data, isLoading, mutate } = useSWR(apiUrl, fetcher)

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    setSyncError(null)
    try {
      const res = await fetch('/api/sync/manual', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '同期失敗')
      setSyncResult({ imported: json.imported, skipped: json.skipped })
      mutate() // ランキングデータを再取得
    } catch (e) {
      setSyncError(String(e))
    } finally {
      setSyncing(false)
    }
  }

  const rankings = data?.rankings ?? []
  const teamTotal = data?.teamTotal ?? 0
  const teamTarget = data?.teamTarget ?? 0
  const teamAchievementRate = data?.teamAchievementRate ?? 0

  const isCurrent = period === 'monthly'
    ? isCurrentMonth(year, month)
    : isCurrentWeek(year, month, week)

  const periodLabel = period === 'monthly'
    ? `${year}年${month}月`
    : `${year}年${month}月 W${week}`

  const handlePrev = () => {
    if (period === 'monthly') {
      const r = addMonth(year, month, -1); setYear(r.year); setMonth(r.month)
    } else {
      const r = prevWeek(year, month, week); setYear(r.year); setMonth(r.month); setWeek(r.week)
    }
  }

  const handleNext = () => {
    if (isCurrent) return
    if (period === 'monthly') {
      const r = addMonth(year, month, 1); setYear(r.year); setMonth(r.month)
    } else {
      const r = nextWeek(year, month, week); setYear(r.year); setMonth(r.month); setWeek(r.week)
    }
  }

  return (
    <>
      <Header title="着金ランキング" subtitle="チームの競争状況" />

      <div className="p-3 md:p-6 space-y-4">
        {/* コントロールパネル */}
        <div className="bg-gray-900 rounded-2xl p-4 space-y-4">

          {/* 期間タブ */}
          <div className="flex gap-2">
            {(Object.entries(PERIOD_CONFIG) as [Period, typeof PERIOD_CONFIG[Period]][]).map(([p, cfg]) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  period === p
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          {/* カテゴリタブ */}
          <div className="flex gap-2 flex-wrap">
            {availableCategories.map(([c, cfg]) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex flex-col items-start px-4 py-2.5 rounded-xl border-2 transition-all ${
                  category === c
                    ? `${cfg.border} bg-white/15`
                    : 'border-white/15 hover:border-white/35 hover:bg-white/5'
                }`}
              >
                <span className={`text-sm font-bold ${category === c ? 'text-white' : 'text-gray-400'}`}>{cfg.label}</span>
                <span className="text-xs text-gray-500">{cfg.target}</span>
              </button>
            ))}
          </div>

          {/* スプシ同期ボタン */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                syncing
                  ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
              }`}
            >
              <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
              {syncing ? '同期中...' : 'スプシ更新'}
            </button>
            {syncResult && (
              <span className="text-xs text-emerald-400 font-semibold">
                ✅ {syncResult.imported}件取込
              </span>
            )}
            {syncError && (
              <span className="text-xs text-red-400 font-semibold">⚠️ {syncError}</span>
            )}
          </div>

          {/* 期間ナビゲーター */}
          <div className="flex items-center gap-2">
            <button onClick={handlePrev}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-white font-semibold text-sm min-w-[140px] text-center">{periodLabel}</span>
            <button
              onClick={handleNext}
              disabled={isCurrent}
              className={`p-1.5 rounded-lg transition-colors ${
                isCurrent ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <ChevronRight size={18} />
            </button>
            {!isCurrent && (
              <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); setWeek(Math.ceil(now.getDate() / 7)) }}
                className="ml-1 px-3 py-1 text-xs rounded-full bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition-colors">
                今{period === 'monthly' ? '月' : '週'}
              </button>
            )}
          </div>
        </div>

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
