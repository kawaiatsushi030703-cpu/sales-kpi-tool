'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { MemberProgressList } from '@/components/dashboard/MemberProgressList'
import { UrgentDealList } from '@/components/dashboard/UrgentDealList'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { formatCurrency } from '@/lib/utils'
import { Target, ChevronLeft, ChevronRight } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Tab = '月間' | '週間' | '年間'

function rateColor(r: number) {
  if (r >= 100) return { text: 'text-emerald-600', bar: '#10b981' }
  if (r >= 70)  return { text: 'text-amber-600',   bar: '#f59e0b' }
  return              { text: 'text-red-500',       bar: '#ef4444' }
}

/* ─── 月間KPIカード ─── */
function MonthlyCard({
  label, sublabel, target, payment, contractTotal, achievementRate, color, large,
}: {
  label: string; sublabel: string; target: number; payment: number
  contractTotal?: number; achievementRate: number; color: string; large?: boolean
}) {
  const clr = rateColor(achievementRate)
  const remaining = Math.max(0, target - payment)
  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden ${large ? 'shadow-md' : 'shadow-sm'}`}
      style={{ borderTop: `4px solid ${color}` }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider">{sublabel}</p>
            <p className="font-bold text-lg mt-0.5" style={{ color }}>{label}</p>
          </div>
          <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
            目標 {formatCurrency(target)}
          </span>
        </div>

        {/* 達成率（数字大） */}
        <div className="flex items-end gap-1 mb-3">
          <span className={`font-bold leading-none ${clr.text}`}
            style={{ fontSize: large ? '5.5rem' : '4rem' }}>
            {achievementRate}
          </span>
          <span className={`font-bold mb-2 ${clr.text}`}
            style={{ fontSize: large ? '2rem' : '1.5rem' }}>%</span>
        </div>

        {/* プログレスバー */}
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          {[25, 50, 75].map(p => (
            <div key={p} className="absolute top-0 bottom-0 w-px bg-gray-200 z-10" style={{ left: `${p}%` }} />
          ))}
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(achievementRate, 100)}%`, background: color }} />
        </div>

        {/* 売上 / 着金 / 残り */}
        <div className={`grid gap-2 ${contractTotal != null ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {contractTotal != null && (
            <div className="bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="text-gray-400 text-xs">売上額</p>
              <p className="text-gray-700 font-bold text-sm mt-0.5">{formatCurrency(contractTotal)}</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl px-3 py-2.5">
            <p className="text-gray-400 text-xs">着金額</p>
            <p className="text-gray-900 font-bold text-sm mt-0.5">{formatCurrency(payment)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5">
            <p className="text-gray-400 text-xs">残り</p>
            <p className={`font-bold text-sm mt-0.5 ${remaining > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── 年間バナー ─── */
interface MonthlyBreakdownItem {
  month: number; payment: number; target: number; achievementRate: number; isFuture: boolean
}
function AnnualView({ annual }: { annual: { target: number; payment: number; monthlyBreakdown?: MonthlyBreakdownItem[] } }) {
  const pct = annual.target > 0 ? Math.floor(annual.payment / annual.target * 100) : 0
  const remaining = Math.max(0, annual.target - annual.payment)
  const clr = rateColor(pct)
  const breakdown = annual.monthlyBreakdown ?? []
  const maxPayment = Math.max(...breakdown.map(m => Math.max(m.payment, m.target)), 1)

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl px-6 py-6"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
          border: '1.5px solid #a16207',
        }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(251,191,36,0.12) 0%, transparent 60%)' }} />

        <div className="relative flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Target size={18} className="text-yellow-500 shrink-0" />
            <div>
              <p className="text-yellow-700 text-xs font-bold tracking-widest uppercase">Annual Goal {new Date().getFullYear()}</p>
              <p className="text-yellow-300 font-bold text-2xl leading-tight">年間目標 10億円</p>
            </div>
          </div>
          <p className={`font-bold text-5xl leading-none ${clr.text}`}>{pct}<span className="text-2xl">%</span></p>
        </div>

        <div className="relative h-5 rounded-full overflow-hidden mb-3"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          {[25, 50, 75].map(p => (
            <div key={p} className="absolute top-0 bottom-0 w-px z-10"
              style={{ left: `${p}%`, background: 'rgba(255,255,255,0.12)' }} />
          ))}
          <div className="h-full rounded-full transition-all duration-700 relative"
            style={{ width: `${Math.min(pct, 100)}%`, background: 'linear-gradient(90deg, #d97706, #fbbf24, #fde68a)' }}>
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-transparent" />
          </div>
        </div>

        <div className="relative flex justify-between text-xs">
          <span className="text-gray-500">¥0</span>
          <span className="text-yellow-500 font-semibold">{formatCurrency(annual.payment)} 着金済み</span>
          <span className="text-gray-500">¥1,000,000,000</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-yellow-400">
          <p className="text-gray-400 text-xs uppercase tracking-wider">累計着金</p>
          <p className="font-bold text-2xl text-gray-900 mt-1">{formatCurrency(annual.payment)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-gray-200">
          <p className="text-gray-400 text-xs uppercase tracking-wider">残り目標</p>
          <p className={`font-bold text-2xl mt-1 ${remaining > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {/* 月別内訳 */}
      {breakdown.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-gray-700 font-bold text-sm mb-4">月別実績</p>
          {/* バーチャート */}
          <div className="flex items-end gap-1.5 mb-4" style={{ height: 80 }}>
            {breakdown.map(m => {
              const barH = m.isFuture ? 0 : Math.round((m.payment / maxPayment) * 80)
              const targetH = Math.round((m.target / maxPayment) * 80)
              const clr = rateColor(m.achievementRate)
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-0.5" style={{ height: 80 }}>
                  <div className="w-full relative flex flex-col justify-end" style={{ height: 80 }}>
                    {/* 目標ライン */}
                    <div className="absolute w-full border-t-2 border-dashed border-gray-200 z-10"
                      style={{ bottom: targetH }} />
                    {/* 実績バー */}
                    {!m.isFuture && (
                      <div className="w-full rounded-t transition-all duration-700"
                        style={{ height: barH, background: clr.bar, opacity: 0.85 }} />
                    )}
                    {m.isFuture && (
                      <div className="w-full rounded-t bg-gray-100" style={{ height: 4 }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {/* テーブル */}
          <div className="space-y-1">
            {breakdown.map(m => {
              const clr = rateColor(m.achievementRate)
              return (
                <div key={m.month} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${m.isFuture ? 'opacity-35' : ''}`}>
                  <span className="text-gray-500 text-xs font-semibold w-7 shrink-0">{m.month}月</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: m.isFuture ? '0%' : `${Math.min(m.achievementRate, 100)}%`, background: clr.bar }} />
                  </div>
                  <span className={`text-xs font-bold w-12 text-right ${m.isFuture ? 'text-gray-300' : clr.text}`}>
                    {m.isFuture ? '–' : `${m.achievementRate}%`}
                  </span>
                  <span className="text-gray-400 text-xs w-24 text-right shrink-0">
                    {m.isFuture ? '–' : formatCurrency(m.payment)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── 週間カード ─── */
interface WeekData {
  label: string; weekNum: number; isCurrent: boolean
  buhan: { payment: number; target: number; achievementRate: number }
  ai:    { payment: number; target: number; achievementRate: number }
}

function WeekCard({ week }: { week: WeekData }) {
  const { label, isCurrent, buhan, ai } = week
  const bc = rateColor(buhan.achievementRate)
  const ac = rateColor(ai.achievementRate)
  return (
    <div className={`rounded-xl p-4 border-2 transition-all ${
      isCurrent ? 'bg-white border-indigo-400 shadow-md' : 'bg-white border-gray-100 opacity-60'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <span className={`font-bold text-xl ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
        {isCurrent && (
          <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
            今週
          </span>
        )}
      </div>
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-orange-500 text-xs font-semibold">物販</span>
          <span className={`font-bold text-xl ${bc.text}`}>{buhan.achievementRate}<span className="text-sm">%</span></span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(buhan.achievementRate, 100)}%`, background: bc.bar }} />
        </div>
        <p className="text-gray-400 text-xs mt-1">{formatCurrency(buhan.payment)} / {formatCurrency(buhan.target)}</p>
      </div>
      <div className="border-t border-gray-100 mb-3" />
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-cyan-500 text-xs font-semibold">AI</span>
          <span className={`font-bold text-xl ${ac.text}`}>{ai.achievementRate}<span className="text-sm">%</span></span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(ai.achievementRate, 100)}%`, background: ac.bar }} />
        </div>
        <p className="text-gray-400 text-xs mt-1">{formatCurrency(ai.payment)} / {formatCurrency(ai.target)}</p>
      </div>
    </div>
  )
}

/* ─── メインページ ─── */
export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('月間')
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)

  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1

  function prevMonth() {
    if (selectedMonth === 1) { setSelectedYear(y => y - 1); setSelectedMonth(12) }
    else setSelectedMonth(m => m - 1)
  }
  function nextMonth() {
    if (isCurrentMonth) return
    if (selectedMonth === 12) { setSelectedYear(y => y + 1); setSelectedMonth(1) }
    else setSelectedMonth(m => m + 1)
  }

  const apiUrl = `/api/dashboard?year=${selectedYear}&month=${selectedMonth}`
  const { data, error, isLoading } = useSWR(apiUrl, fetcher, { refreshInterval: 10000 })

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-500">データの取得に失敗しました</p>
    </div>
  )

  const tabs: Tab[] = ['月間', '週間', '年間']

  return (
    <>
      <Header title="ダッシュボード" subtitle={`${selectedYear}年${selectedMonth}月`} />

      <div className="p-3 md:p-6 space-y-4">

        {/* ── タブ：月間を左端・デフォルト選択 ── */}
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl w-fit">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === t
                  ? 'bg-indigo-600 text-white shadow-sm'   // アクティブ: 強調
                  : 'text-gray-400 hover:text-gray-600'    // 非アクティブ: グレー
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ══════ 月間タブ（最重要・ファーストビューで完結） ══════ */}
        {tab === '月間' && (
          <div className="space-y-3">

            {/* 月間ラベル + ナビゲーション */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                <p className="text-gray-900 font-black text-lg tracking-tight">
                  {selectedMonth}月 月間実績
                </p>
                {isCurrentMonth && (
                  <span className="ml-1 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    今月
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-gray-500 text-sm font-medium min-w-[4rem] text-center">
                  {selectedYear}/{String(selectedMonth).padStart(2, '0')}
                </span>
                <button
                  onClick={nextMonth}
                  disabled={isCurrentMonth}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* 総合カード（一番大きく・リング付き） */}
            <div className="ring-2 ring-indigo-400 ring-offset-2 rounded-2xl">
              <MonthlyCard
                label="総合" sublabel="Monthly Total"
                target={data?.monthly?.target ?? 0}
                payment={data?.monthly?.payment ?? 0}
                contractTotal={data?.monthly?.contractTotal ?? 0}
                achievementRate={data?.monthly?.achievementRate ?? 0}
                color="#6366f1"
                large
              />
            </div>

            {/* 物販 / AI（横並び） */}
            <div className="grid grid-cols-2 gap-3">
              <MonthlyCard
                label="物販" sublabel="Merchandise"
                target={data?.monthly?.buhan?.target ?? 0}
                payment={data?.monthly?.buhan?.payment ?? 0}
                achievementRate={data?.monthly?.buhan?.achievementRate ?? 0}
                color="#fb923c"
              />
              <MonthlyCard
                label="AI" sublabel="AI Solutions"
                target={data?.monthly?.ai?.target ?? 0}
                payment={data?.monthly?.ai?.payment ?? 0}
                achievementRate={data?.monthly?.ai?.achievementRate ?? 0}
                color="#22d3ee"
              />
            </div>

            {/* メンバー進捗 & グラフ */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <p className="text-gray-700 font-bold text-sm">メンバー別着金状況</p>
                  <p className="text-gray-400 text-xs mt-0.5">チーム全員・今月</p>
                </CardHeader>
                <CardBody className="space-y-4">
                  {data?.members && data.members.length > 0 && <SalesChart members={data.members} />}
                  <MemberProgressList members={data?.members ?? []} />
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <p className="text-gray-700 font-bold text-sm">要対応</p>
                  <p className="text-gray-400 text-xs mt-0.5">期日3日以内・超過</p>
                </CardHeader>
                <CardBody>
                  <UrgentDealList deals={data?.urgentDeals ?? []} />
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {/* ══════ 週間タブ ══════ */}
        {tab === '週間' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gray-400 rounded-full" />
              <p className="text-gray-700 font-bold text-base">週間実績</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {(data?.weeklyBreakdown ?? []).map((w: WeekData) => (
                <WeekCard key={w.label} week={w} />
              ))}
            </div>
          </div>
        )}

        {/* ══════ 年間タブ ══════ */}
        {tab === '年間' && data?.annual && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-yellow-500 rounded-full" />
              <p className="text-gray-700 font-bold text-base">年間実績</p>
            </div>
            <AnnualView annual={data.annual} />
          </div>
        )}

      </div>
    </>
  )
}
