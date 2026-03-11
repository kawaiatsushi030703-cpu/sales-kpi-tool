'use client'
import { useState, useEffect } from 'react'
import { formatDate, getDueDateLabel } from '@/lib/utils'
import { DealStatusBadge } from './DealStatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

interface Deal {
  id: number
  customerName: string
  memberName: string
  memberColor: string
  productName: string
  category: string
  contractAmount: number
  paymentAmount: number
  remainingAmount: number
  status: string
  nextAction: string | null
  meetingDate: string | null
  dueDate: string | null
}

function CategoryBadge({ category, onToggle }: { category: string; onToggle?: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-1.5 py-0.5 rounded text-xs font-bold transition-opacity ${
        onToggle ? 'hover:opacity-70 cursor-pointer' : 'cursor-default'
      } ${category === 'AI' ? 'bg-cyan-100 text-cyan-700' : 'bg-orange-100 text-orange-700'}`}
      title={onToggle ? (category === 'AI' ? '物販に変更' : 'AIに変更') : undefined}
    >
      {category}
    </button>
  )
}

interface Props {
  deals: Deal[]
  onEdit: (deal: Deal) => void
  onDelete: (id: number) => void
  onQuickUpdate: (id: number, contractAmount: number, paymentAmount: number) => Promise<void>
  onCategoryToggle: (id: number, newCategory: string) => Promise<void>
  sortBy: string
  order: 'asc' | 'desc'
  onSort: (col: string) => void
}

function SortIcon({ col, sortBy, order }: { col: string; sortBy: string; order: string }) {
  if (col !== sortBy) return <span className="text-gray-300 ml-1">↕</span>
  return order === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />
}

function useAmountEdit(deal: Deal, onQuickUpdate: Props['onQuickUpdate']) {
  const toMan = (yen: number) => String(yen / 10000)
  const [contract, setContract] = useState(toMan(deal.contractAmount))
  const [payment, setPayment] = useState(toMan(deal.paymentAmount))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!dirty) {
      setContract(toMan(deal.contractAmount))
      setPayment(toMan(deal.paymentAmount))
    }
  }, [deal.contractAmount, deal.paymentAmount]) // eslint-disable-line react-hooks/exhaustive-deps

  const remaining = (parseFloat(contract) || 0) - (parseFloat(payment) || 0)

  const handleSave = async () => {
    if (!dirty) return
    setSaving(true)
    try {
      await onQuickUpdate(deal.id, Math.round((parseFloat(contract) || 0) * 10000), Math.round((parseFloat(payment) || 0) * 10000))
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  return { contract, setContract, payment, setPayment, dirty, setDirty, saving, handleSave, remaining }
}

// PCテーブル行
function DealRow({ deal, onEdit, onDelete, onQuickUpdate, onCategoryToggle }: {
  deal: Deal; onEdit: Props['onEdit']; onDelete: Props['onDelete']; onQuickUpdate: Props['onQuickUpdate']; onCategoryToggle: Props['onCategoryToggle']
}) {
  const { contract, setContract, payment, setPayment, setDirty, saving, handleSave, remaining } = useAmountEdit(deal, onQuickUpdate)
  const dueDateInfo = getDueDateLabel(deal.dueDate)
  const isUrgent = dueDateInfo && (dueDateInfo.color.includes('red') || dueDateInfo.color.includes('orange'))

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isUrgent ? 'bg-red-50/30' : ''}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-medium text-gray-900">{deal.customerName}</p>
          <CategoryBadge category={deal.category} onToggle={() => onCategoryToggle(deal.id, deal.category === 'AI' ? '物販' : 'AI')} />
        </div>
        <p className="text-xs text-gray-400">{deal.productName}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar name={deal.memberName} color={deal.memberColor} size="sm" />
          <span className="text-gray-700">{deal.memberName}</span>
        </div>
      </td>
      <td className="px-4 py-3"><DealStatusBadge status={deal.status} /></td>
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {deal.meetingDate ? formatDate(deal.meetingDate) : <span className="text-gray-300">-</span>}
      </td>
      <td className="px-4 py-2">
        <input type="number" className="w-24 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
          value={contract} onChange={(e) => { setContract(e.target.value); setDirty(true) }}
          onBlur={handleSave} onKeyDown={(e) => e.key === 'Enter' && handleSave()} disabled={saving} min={0} step="any" />
      </td>
      <td className="px-4 py-2">
        <input type="number" className="w-24 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 text-emerald-700 font-semibold"
          value={payment} onChange={(e) => { setPayment(e.target.value); setDirty(true) }}
          onBlur={handleSave} onKeyDown={(e) => e.key === 'Enter' && handleSave()} disabled={saving} min={0} step="any" />
      </td>
      <td className="px-4 py-3">
        <span className={remaining > 0 ? 'text-orange-600' : 'text-gray-400'}>
          {remaining > 0 ? `${remaining.toLocaleString()}万` : '-'}
        </span>
      </td>
      <td className="px-4 py-3">
        {deal.dueDate ? (
          <div>
            <p className="text-gray-600">{formatDate(deal.dueDate)}</p>
            {dueDateInfo && <p className={`text-xs ${dueDateInfo.color}`}>{dueDateInfo.label}</p>}
          </div>
        ) : <span className="text-gray-300">-</span>}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{deal.nextAction ?? '-'}</td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <button onClick={() => onEdit(deal)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Edit2 size={14} /></button>
          <button onClick={() => { if (confirm('この案件を削除しますか？')) onDelete(deal.id) }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
        </div>
      </td>
    </tr>
  )
}

// スマホカード
function DealCard({ deal, onEdit, onDelete, onQuickUpdate, onCategoryToggle }: {
  deal: Deal; onEdit: Props['onEdit']; onDelete: Props['onDelete']; onQuickUpdate: Props['onQuickUpdate']; onCategoryToggle: Props['onCategoryToggle']
}) {
  const { contract, setContract, payment, setPayment, setDirty, saving, handleSave, remaining } = useAmountEdit(deal, onQuickUpdate)
  const dueDateInfo = getDueDateLabel(deal.dueDate)
  const isUrgent = dueDateInfo && (dueDateInfo.color.includes('red') || dueDateInfo.color.includes('orange'))

  return (
    <div className={`p-4 border-b border-gray-100 ${isUrgent ? 'bg-red-50/40' : 'bg-white'}`}>
      {/* 上段: 顧客名 + ステータス + ボタン */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{deal.customerName}</p>
            <CategoryBadge category={deal.category} onToggle={() => onCategoryToggle(deal.id, deal.category === 'AI' ? '物販' : 'AI')} />
            <DealStatusBadge status={deal.status} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{deal.productName}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(deal)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Edit2 size={15} /></button>
          <button onClick={() => { if (confirm('この案件を削除しますか？')) onDelete(deal.id) }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={15} /></button>
        </div>
      </div>

      {/* 担当者 + 日付 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Avatar name={deal.memberName} color={deal.memberColor} size="sm" />
          <span className="text-sm text-gray-600">{deal.memberName}</span>
        </div>
        <div className="text-right">
          {deal.meetingDate && (
            <p className="text-xs text-indigo-600 font-medium">面談 {formatDate(deal.meetingDate)}</p>
          )}
          {deal.dueDate && (
            <p className={`text-xs ${dueDateInfo?.color ?? 'text-gray-500'}`}>
              期日 {formatDate(deal.dueDate)}{dueDateInfo && ` (${dueDateInfo.label})`}
            </p>
          )}
        </div>
      </div>

      {/* 金額入力 */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-xs text-gray-400 mb-1">売上(万円)</p>
          <input type="number" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            value={contract} onChange={(e) => { setContract(e.target.value); setDirty(true) }}
            onBlur={handleSave} onKeyDown={(e) => e.key === 'Enter' && handleSave()} disabled={saving} min={0} step="any" />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">着金(万円)</p>
          <input type="number" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 text-emerald-700 font-semibold"
            value={payment} onChange={(e) => { setPayment(e.target.value); setDirty(true) }}
            onBlur={handleSave} onKeyDown={(e) => e.key === 'Enter' && handleSave()} disabled={saving} min={0} step="any" />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">残額</p>
          <p className={`py-1.5 text-sm font-medium ${remaining > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
            {remaining > 0 ? `${remaining.toLocaleString()}万` : '-'}
          </p>
        </div>
      </div>

      {/* 次回アクション */}
      {deal.nextAction && (
        <p className="mt-2 text-xs text-indigo-600 bg-indigo-50 rounded px-2 py-1 truncate">→ {deal.nextAction}</p>
      )}
    </div>
  )
}

export function DealTable({ deals, onEdit, onDelete, onQuickUpdate, onCategoryToggle, sortBy, order, onSort }: Props) {
  return (
    <>
      {/* PC: テーブル */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {[
                { col: 'customerName', label: '顧客名' },
                { col: 'member', label: '担当者' },
                { col: 'status', label: 'ステータス' },
                { col: 'meetingDate', label: '面談日' },
                { col: 'contractAmount', label: '売り上げ(万円)' },
                { col: 'paymentAmount', label: '着金額(万円)' },
                { col: 'remainingAmount', label: '残額' },
                { col: 'dueDate', label: '期日' },
              ].map(({ col, label }) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 select-none" onClick={() => onSort(col)}>
                  {label}<SortIcon col={col} sortBy={sortBy} order={order} />
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
            {deals.map((deal) => (
              <DealRow key={deal.id} deal={deal} onEdit={onEdit} onDelete={onDelete} onQuickUpdate={onQuickUpdate} onCategoryToggle={onCategoryToggle} />
            ))}
          </tbody>
        </table>
      </div>

      {/* スマホ: カード */}
      <div className="md:hidden divide-y divide-gray-100">
        {deals.length === 0 && (
          <p className="px-4 py-10 text-center text-gray-400">案件が見つかりません</p>
        )}
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onEdit={onEdit} onDelete={onDelete} onQuickUpdate={onQuickUpdate} onCategoryToggle={onCategoryToggle} />
        ))}
      </div>
    </>
  )
}
