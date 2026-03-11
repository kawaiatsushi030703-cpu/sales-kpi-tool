'use client'
import { formatCurrency, formatDate, getDueDateLabel } from '@/lib/utils'
import { DealStatusBadge } from './DealStatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

interface Deal {
  id: number
  customerName: string
  memberName: string
  memberColor: string
  productName: string
  contractAmount: number
  paymentAmount: number
  remainingAmount: number
  status: string
  nextAction: string | null
  dueDate: string | null
}

interface Props {
  deals: Deal[]
  onEdit: (deal: Deal) => void
  onDelete: (id: number) => void
  sortBy: string
  order: 'asc' | 'desc'
  onSort: (col: string) => void
}

function SortIcon({ col, sortBy, order }: { col: string; sortBy: string; order: string }) {
  if (col !== sortBy) return <span className="text-gray-300 ml-1">↕</span>
  return order === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />
}

export function DealTable({ deals, onEdit, onDelete, sortBy, order, onSort }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {[
              { col: 'customerName', label: '顧客名' },
              { col: 'member', label: '担当者' },
              { col: 'status', label: 'ステータス' },
              { col: 'contractAmount', label: '契約額' },
              { col: 'paymentAmount', label: '着金額' },
              { col: 'remainingAmount', label: '残額' },
              { col: 'dueDate', label: '期日' },
            ].map(({ col, label }) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 select-none"
                onClick={() => onSort(col)}
              >
                {label}
                <SortIcon col={col} sortBy={sortBy} order={order} />
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">次回アクション</th>
            <th className="px-4 py-3 w-20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {deals.length === 0 && (
            <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">案件が見つかりません</td></tr>
          )}
          {deals.map((deal) => {
            const dueDateInfo = getDueDateLabel(deal.dueDate)
            const isUrgent = dueDateInfo && (dueDateInfo.color.includes('red') || dueDateInfo.color.includes('orange'))
            return (
              <tr key={deal.id} className={`hover:bg-gray-50 transition-colors ${isUrgent ? 'bg-red-50/30' : ''}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{deal.customerName}</p>
                  <p className="text-xs text-gray-400">{deal.productName}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={deal.memberName} color={deal.memberColor} size="sm" />
                    <span className="text-gray-700">{deal.memberName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <DealStatusBadge status={deal.status} />
                </td>
                <td className="px-4 py-3 text-gray-700">{formatCurrency(deal.contractAmount)}</td>
                <td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(deal.paymentAmount)}</td>
                <td className="px-4 py-3">
                  <span className={deal.remainingAmount > 0 ? 'text-orange-600' : 'text-gray-400'}>
                    {formatCurrency(deal.remainingAmount)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {deal.dueDate ? (
                    <div>
                      <p className="text-gray-600">{formatDate(deal.dueDate)}</p>
                      {dueDateInfo && (
                        <p className={`text-xs ${dueDateInfo.color}`}>{dueDateInfo.label}</p>
                      )}
                    </div>
                  ) : <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">
                  {deal.nextAction ?? '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(deal)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm('この案件を削除しますか？')) onDelete(deal.id) }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
