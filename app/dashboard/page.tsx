'use client'
import useSWR from 'swr'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { MemberProgressList } from '@/components/dashboard/MemberProgressList'
import { UrgentDealList } from '@/components/dashboard/UrgentDealList'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { formatCurrency } from '@/lib/utils'
import { Flame, Zap, Target } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function rateColor(r: number) {
  if (r >= 100) return { text: 'text-emerald-600', bar: '#10b981', label: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  if (r >= 70)  return { text: 'text-amber-600',   bar: '#f59e0b', label: 'bg-amber-100 text-amber-700 border-amber-200' }
  return              { text: 'text-red-500',       bar: '#ef4444', label: 'bg-red-100 text-red-600 border-red-200' }
}

// 年間バナー
function AnnualBanner({ annual }: { annual: { target: number; payment: number } }) {
  return (
    <div className="relative overflow-hidden flex items-center justify-between rounded-2xl px-6 py-4"
      style={{ background: 'linear-gradient(135deg, #1a1200 0%, #2d1f00 50%, #1a1200 100%)', border: '1px solid #a16207' }}>
      {/* 背景の光沢 */}
      <div className="absolute inset-0 opacity-20"
        style={{ background: 'radial-gradient(ellipse at 30% 50%, #fbbf24 0%, transparent 60%)' }} />

      <div className="relative flex items-center gap-4">
        <Target size={18} className="text-yellow-500 shrink-0" />
        <div>
          <p className="text-yellow-700 text-xs font-semibold tracking-widest uppercase">Annual Goal</p>
          <p className="font-game leading-none"
            style={{ fontSize: '2rem', background: 'linear-gradient(90deg, #fbbf24, #fde68a, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            10億円
          </p>
        </div>
      </div>

      <div className="relative text-right">
        <p className="text-yellow-800 text-xs">累計着金</p>
        <p className="font-game text-yellow-300 text-lg">{formatCurrency(annual.payment)}</p>
        <p className="text-yellow-500 text-sm font-bold mt-0.5">
          {annual.target > 0 ? Math.floor(annual.payment / annual.target * 100) : 0}%
        </p>
      </div>
    </div>
  )
}

// 月間KPIカード
function MonthlyCard({
  label, sublabel, target, payment, achievementRate, borderColor,
}: {
  label: string; sublabel: string; target: number; payment: number
  achievementRate: number; borderColor: string
}) {
  const clr = rateColor(achievementRate)
  const remaining = Math.max(0, target - payment)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm overflow-hidden relative"
      style={{ borderTop: `4px solid ${borderColor}` }}>

      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider">{sublabel}</p>
          <p className="font-game text-xl mt-0.5" style={{ color: borderColor }}>{label}</p>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-lg">
          目標 {formatCurrency(target)}
        </span>
      </div>

      {/* 達成率 */}
      <div className="flex items-end gap-1 mb-3">
        <p className={`font-game leading-none ${clr.text}`} style={{ fontSize: '4.5rem' }}>
          {achievementRate}
        </p>
        <p className={`font-game text-2xl mb-2 ${clr.text}`}>%</p>
      </div>

      {/* プログレスバー */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-4 border border-gray-200">
        {[25, 50, 75].map(p => (
          <div key={p} className="absolute top-0 bottom-0 w-px bg-gray-300 z-10" style={{ left: `${p}%` }} />
        ))}
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(achievementRate, 100)}%`, background: borderColor }} />
      </div>

      {/* 金額 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <p className="text-gray-400 text-xs">着金</p>
          <p className="text-gray-900 font-bold text-sm mt-0.5">{formatCurrency(payment)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <p className="text-gray-400 text-xs">残り</p>
          <p className={`font-bold text-sm mt-0.5 ${remaining > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>
    </div>
  )
}

// 週間4週カード
interface WeekData {
  label: string; weekNum: number; isCurrent: boolean
  buhan: { payment: number; target: number; achievementRate: number }
  ai: { payment: number; target: number; achievementRate: number }
}

function WeekCard({ week }: { week: WeekData }) {
  const { label, isCurrent, buhan, ai } = week
  const bc = rateColor(buhan.achievementRate)
  const ac = rateColor(ai.achievementRate)

  return (
    <div className={`rounded-xl p-4 border-2 transition-all ${
      isCurrent ? 'bg-white border-indigo-400 shadow-md' : 'bg-white border-gray-200 opacity-60'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <span className={`font-game text-2xl ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
        {isCurrent && (
          <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
            <Zap size={10} />今週
          </span>
        )}
      </div>

      {/* 物販 */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-orange-500 text-xs font-semibold">物販</span>
          <span className={`font-game text-xl ${bc.text}`}>{buhan.achievementRate}<span className="text-sm">%</span></span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(buhan.achievementRate, 100)}%`, background: bc.bar }} />
        </div>
        <p className="text-gray-500 text-xs mt-1">{formatCurrency(buhan.payment)} <span className="text-gray-300">/ {formatCurrency(buhan.target)}</span></p>
      </div>

      <div className="border-t border-gray-100 mb-3" />

      {/* AI */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-cyan-500 text-xs font-semibold">AI</span>
          <span className={`font-game text-xl ${ac.text}`}>{ai.achievementRate}<span className="text-sm">%</span></span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(ai.achievementRate, 100)}%`, background: ac.bar }} />
        </div>
        <p className="text-gray-500 text-xs mt-1">{formatCurrency(ai.payment)} <span className="text-gray-300">/ {formatCurrency(ai.target)}</span></p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR('/api/dashboard', fetcher, { refreshInterval: 10000 })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-400 text-sm">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">データの取得に失敗しました</p>
      </div>
    )
  }

  return (
    <>
      <Header title="ダッシュボード" subtitle={`${new Date().getFullYear()}年${new Date().getMonth() + 1}月`} />

      <div className="p-3 md:p-6 space-y-5">
        {data?.annual && <AnnualBanner annual={data.annual} />}

        {/* MONTHLY */}
        <div>
          <p className="font-game text-gray-400 text-xs tracking-widest mb-3">── MONTHLY</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MonthlyCard label="物販" sublabel="Merchandise"
              target={data?.monthly?.buhan?.target ?? 0}
              payment={data?.monthly?.buhan?.payment ?? 0}
              achievementRate={data?.monthly?.buhan?.achievementRate ?? 0}
              borderColor="#fb923c"
            />
            <MonthlyCard label="AI" sublabel="AI Solutions"
              target={data?.monthly?.ai?.target ?? 0}
              payment={data?.monthly?.ai?.payment ?? 0}
              achievementRate={data?.monthly?.ai?.achievementRate ?? 0}
              borderColor="#22d3ee"
            />
          </div>
        </div>

        {/* WEEKLY */}
        <div>
          <p className="font-game text-gray-400 text-xs tracking-widest mb-3">── WEEKLY</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {(data?.weeklyBreakdown ?? []).map((w: WeekData) => (
              <WeekCard key={w.label} week={w} />
            ))}
          </div>
        </div>

        {/* メンバー & 要対応 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-orange-400" />
                <span className="font-game text-gray-700 text-sm tracking-wide">MEMBER PROGRESS</span>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {data?.members && data.members.length > 0 && <SalesChart members={data.members} />}
              <MemberProgressList members={data?.members ?? []} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <span className="font-game text-gray-700 text-sm tracking-wide">⚠ URGENT</span>
              <p className="text-gray-400 text-xs mt-0.5">期日3日以内・超過</p>
            </CardHeader>
            <CardBody>
              <UrgentDealList deals={data?.urgentDeals ?? []} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
