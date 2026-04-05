'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { MemberWithStats } from '@/types'

interface Props {
  members: MemberWithStats[]
}

const CustomTooltip = ({
  active, payload, label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  const payment = payload.find(p => p.dataKey === '着金額')?.value ?? 0
  const target  = payload.find(p => p.dataKey === '目標')?.value ?? 0
  const rate = target > 0 ? Math.floor((payment / target) * 100) : 0
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-bold text-gray-900 mb-2 pb-1.5 border-b border-gray-100">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400 text-xs">着金</span>
          <span className="font-bold text-gray-900">{formatCurrency(payment)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400 text-xs">目標</span>
          <span className="text-gray-500">{formatCurrency(target)}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-gray-100">
          <span className="text-gray-400 text-xs">達成率</span>
          <span className={`font-bold text-xs ${
            rate >= 100 ? 'text-emerald-600' : rate >= 70 ? 'text-amber-500' : 'text-red-500'
          }`}>{rate}%</span>
        </div>
      </div>
    </div>
  )
}

export function SalesChart({ members }: Props) {
  // 着金額降順でソート
  const data = [...members]
    .sort((a, b) => b.paymentAmount - a.paymentAmount)
    .map((m) => ({
      name: m.name,
      着金額: m.paymentAmount,
      目標: m.targetAmount,
      color: m.avatarColor,
    }))

  // メンバー数に応じて高さを動的に設定（1人40px、最低200px）
  const chartHeight = Math.max(200, data.length * 44)

  return (
    <div>
      {/* 凡例 */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 font-medium">メンバー全員 着金額 vs 目標</p>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-2.5 rounded-sm bg-gray-200" />目標
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-2.5 rounded-sm bg-indigo-400" />着金
          </span>
        </div>
      </div>

      {/* 横向きバーチャート（全員を縦に並べて一覧表示） */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 50, left: 8, bottom: 0 }}
          barCategoryGap="30%"
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={(v) => `${Math.round(v / 10000)}万`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={60}
            tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />

          {/* 目標バー（薄いグレー・背景） */}
          <Bar dataKey="目標" fill="#e5e7eb" radius={[0, 3, 3, 0]} barSize={10} />

          {/* 着金バー（メンバーカラー・前面） */}
          <Bar dataKey="着金額" radius={[0, 3, 3, 0]} barSize={16}
            label={{
              position: 'right',
              formatter: (v: number) => v > 0 ? `${Math.round(v / 10000)}万` : '',
              style: { fontSize: 10, fill: '#6b7280', fontWeight: 600 },
            }}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
