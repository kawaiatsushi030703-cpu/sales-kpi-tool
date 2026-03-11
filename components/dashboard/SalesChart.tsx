'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { MemberWithStats } from '@/types'

interface Props {
  members: MemberWithStats[]
}

// カスタムツールチップ
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function SalesChart({ members }: Props) {
  const data = members
    .sort((a, b) => b.paymentAmount - a.paymentAmount)
    .map((m) => ({
      name: m.name.split(' ')[0], // 名字のみ
      着金額: m.paymentAmount,
      目標: m.targetAmount,
      color: m.avatarColor,
    }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickFormatter={(v) => `${Math.round(v / 10000)}万`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="着金額" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
        <Bar dataKey="目標" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
