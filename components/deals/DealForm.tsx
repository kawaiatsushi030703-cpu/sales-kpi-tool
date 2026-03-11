'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { DEAL_STATUSES } from '@/types'

interface Member { id: number; name: string }

function detectCategory(productName: string): string {
  return /AI|ai|エーアイ/i.test(productName) ? 'AI' : '物販'
}

interface DealFormData {
  customerName: string
  memberId: number
  productName: string
  category: string
  contractAmount: number
  paymentAmount: number
  status: string
  nextAction: string
  meetingDate: string
  dueDate: string
  notes: string
}

interface Props {
  initial?: Partial<DealFormData & { id: number }>
  onSubmit: (data: DealFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function DealForm({ initial, onSubmit, onCancel, loading }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [form, setForm] = useState<DealFormData>({
    customerName: initial?.customerName ?? '',
    memberId: initial?.memberId ?? 0,
    productName: initial?.productName ?? '',
    category: (initial?.category as string) ?? detectCategory(initial?.productName ?? ''),
    contractAmount: initial?.contractAmount ?? 0,
    paymentAmount: initial?.paymentAmount ?? 0,
    status: initial?.status ?? '後追い',
    nextAction: initial?.nextAction ?? '',
    meetingDate: (initial?.meetingDate as string) ? (initial.meetingDate as string).slice(0, 10) : '',
    dueDate: initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
    notes: initial?.notes ?? '',
  })

  useEffect(() => {
    fetch('/api/members').then((r) => r.json()).then(setMembers)
  }, [])

  const set = (key: keyof DealFormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(form)
  }

  const remaining = form.contractAmount - form.paymentAmount

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* 顧客名 */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">顧客名 *</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.customerName}
            onChange={(e) => set('customerName', e.target.value)}
            required
          />
        </div>

        {/* 担当メンバー */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">担当メンバー *</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.memberId}
            onChange={(e) => set('memberId', parseInt(e.target.value))}
            required
          >
            <option value={0} disabled>選択してください</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* ステータス */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          >
            {DEAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* 商品名 */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">商品名 / プラン名 *</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.productName}
            onChange={(e) => {
              set('productName', e.target.value)
              set('category', detectCategory(e.target.value))
            }}
            required
          />
        </div>

        {/* カテゴリ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
          <div className="flex gap-2">
            {['物販', 'AI'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set('category', c)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.category === c
                    ? c === 'AI'
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-orange-500 text-white border-orange-500'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 契約額 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">契約額 (円)</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.contractAmount}
            onChange={(e) => set('contractAmount', parseInt(e.target.value) || 0)}
            min={0}
          />
        </div>

        {/* 着金額 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">着金額 (円)</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.paymentAmount}
            onChange={(e) => set('paymentAmount', parseInt(e.target.value) || 0)}
            min={0}
          />
        </div>

        {/* 残額（自動計算・表示のみ） */}
        <div className="col-span-2">
          <p className="text-sm text-gray-500">
            残額: <span className={remaining < 0 ? 'text-red-600 font-bold' : 'text-gray-700 font-medium'}>
              ¥{remaining.toLocaleString()}
            </span>
          </p>
        </div>

        {/* 次回アクション */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">次回アクション</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.nextAction}
            onChange={(e) => set('nextAction', e.target.value)}
            placeholder="例: 電話フォロー、提案書送付"
          />
        </div>

        {/* 面談日 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">面談日 <span className="text-xs text-gray-400">（週間集計の基準）</span></label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.meetingDate}
            onChange={(e) => set('meetingDate', e.target.value)}
          />
        </div>

        {/* 期日 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">期日</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.dueDate}
            onChange={(e) => set('dueDate', e.target.value)}
          />
        </div>

        {/* 備考 */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>キャンセル</Button>
        <Button type="submit" disabled={loading}>{loading ? '保存中...' : '保存する'}</Button>
      </div>
    </form>
  )
}
