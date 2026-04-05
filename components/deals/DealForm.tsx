'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { DEAL_STATUSES } from '@/types'
import { Trash2 } from 'lucide-react'

interface Member { id: number; name: string }

function detectCategory(productName: string): string {
  return /AI|ai|エーアイ/i.test(productName) ? 'AI' : '物販'
}

interface PaymentRow {
  id: number
  amount: number
  paidAt: string
}

interface EventRow {
  id: number
  type: string
  date: string
  memo?: string
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
  additionalPaymentAmount?: number
  additionalPaymentDate?: string
  editedPayments?: PaymentRow[]
  deletedPaymentIds?: number[]
  newEvents?: { type: string; date: string; memo?: string }[]
  deletedEventIds?: number[]
}

const EVENT_TYPES = ['成約', '一部決済', '未成約', '二回目遷移', '三回目遷移', '四回目遷移', 'フォロー', 'その他']

// 活動種別→ステータスの自動マッピング
const EVENT_TO_STATUS: Record<string, string> = {
  '成約': '成約',
  '一部決済': '一部決済',
  '未成約': '未成約',
  '二回目遷移': '二回目遷移',
  '三回目遷移': '二回目遷移',
  '四回目遷移': '二回目遷移',
}

interface Props {
  initial?: Partial<DealFormData & {
    id: number
    payments?: { id: number; amount: number; paidAt: string }[]
    events?: EventRow[]
  }>
  onSubmit: (data: DealFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function DealForm({ initial, onSubmit, onCancel, loading }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [additionalAmount, setAdditionalAmount] = useState(0)
  const [additionalDate, setAdditionalDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [payments, setPayments] = useState<PaymentRow[]>(
    () => (initial?.payments ?? []).map((p) => ({ id: p.id, amount: p.amount, paidAt: p.paidAt.slice(0, 10) }))
  )
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [events, setEvents] = useState<EventRow[]>(
    () => (initial?.events ?? []).map((e) => ({ ...e, date: e.date.slice(0, 10) }))
  )
  const [deletedEventIds, setDeletedEventIds] = useState<number[]>([])
  const [newEvents, setNewEvents] = useState<{ type: string; date: string; memo: string }[]>([])
  const [addingEvent, setAddingEvent] = useState(false)
  const [newEventType, setNewEventType] = useState(EVENT_TYPES[0])
  const [newEventDate, setNewEventDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [newEventMemo, setNewEventMemo] = useState('')
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

  const updatePayment = (id: number, field: 'amount' | 'paidAt', value: string | number) => {
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p))
  }

  const deletePayment = (id: number) => {
    setPayments((prev) => prev.filter((p) => p.id !== id))
    setDeletedIds((prev) => [...prev, id])
  }

  // 残額計算：編集時はpaymentsから、新規時はform.paymentAmountから
  const paymentsTotal = initial?.id
    ? payments.reduce((s, p) => s + (Number(p.amount) || 0), 0) + (additionalAmount || 0)
    : form.paymentAmount

  const addEvent = () => {
    if (!newEventDate) return
    setNewEvents((prev) => [...prev, { type: newEventType, date: newEventDate, memo: newEventMemo }])
    // 種別に対応するステータスがあれば自動で変更
    if (EVENT_TO_STATUS[newEventType]) {
      set('status', EVENT_TO_STATUS[newEventType])
    }
    setNewEventMemo('')
    setAddingEvent(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      ...form,
      additionalPaymentAmount: additionalAmount > 0 ? additionalAmount : undefined,
      additionalPaymentDate: additionalAmount > 0 ? additionalDate : undefined,
      editedPayments: payments,
      deletedPaymentIds: deletedIds,
      newEvents,
      deletedEventIds,
    })
  }

  const remaining = form.contractAmount - paymentsTotal

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

        {/* 着金額：新規登録時のみ表示。編集時は決済管理セクションで管理 */}
        {!initial?.id && (
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
        )}

        {/* 残額（自動計算・表示のみ） */}
        <div className={initial?.id ? 'col-span-2' : ''}>
          <p className="text-sm text-gray-500">
            残額: <span className={remaining < 0 ? 'text-red-600 font-bold' : 'text-gray-700 font-medium'}>
              ¥{remaining.toLocaleString()}
            </span>
          </p>
        </div>

        {/* 追加決済（編集時のみ表示） */}
        {initial?.id && (
          <div className="col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-amber-800">決済管理</p>

            {/* 既存の決済履歴（編集・削除可） */}
            {payments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-amber-700 font-medium">決済履歴（編集できます）</p>
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 bg-white rounded-lg border border-amber-200 px-2 py-1.5">
                    <input
                      type="date"
                      className="border border-amber-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 w-32"
                      value={p.paidAt}
                      onChange={(e) => updatePayment(p.id, 'paidAt', e.target.value)}
                    />
                    <span className="text-amber-400 text-xs">¥</span>
                    <input
                      type="number"
                      className="border border-amber-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 flex-1 min-w-0"
                      value={p.amount}
                      onChange={(e) => updatePayment(p.id, 'amount', parseInt(e.target.value) || 0)}
                      min={0}
                    />
                    <button
                      type="button"
                      onClick={() => deletePayment(p.id)}
                      className="text-red-400 hover:text-red-600 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 追加決済 */}
            <div className="space-y-1.5">
              <p className="text-xs text-amber-700 font-medium">追加決済</p>
              <p className="text-xs text-amber-500">新たな入金を追加します。週・月のランキングに正しく反映されます。</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-amber-800 mb-1">追加決済額 (円)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    value={additionalAmount || ''}
                    onChange={(e) => setAdditionalAmount(parseInt(e.target.value) || 0)}
                    min={0}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-800 mb-1">決済日</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    value={additionalDate}
                    onChange={(e) => setAdditionalDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-amber-700 font-medium">
              着金合計: ¥{paymentsTotal.toLocaleString()}
            </p>
          </div>
        )}

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

        {/* 活動履歴（編集時のみ） */}
        {initial?.id && (
          <div className="col-span-2 rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-indigo-800">活動履歴</p>

            {/* 既存イベント */}
            {events.length > 0 && (
              <div className="space-y-1.5">
                {events.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 bg-white rounded-lg border border-indigo-200 px-3 py-2 text-sm">
                    <span className="text-indigo-600 font-semibold text-xs whitespace-nowrap">{ev.type}</span>
                    <span className="text-gray-500 text-xs">{ev.date}</span>
                    {ev.memo && <span className="text-gray-600 text-xs flex-1 truncate">{ev.memo}</span>}
                    <button
                      type="button"
                      onClick={() => {
                        setEvents((prev) => prev.filter((e) => e.id !== ev.id))
                        setDeletedEventIds((prev) => [...prev, ev.id])
                      }}
                      className="text-red-400 hover:text-red-600 shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 未保存の新規イベント */}
            {newEvents.length > 0 && (
              <div className="space-y-1">
                {newEvents.map((ev, i) => (
                  <div key={i} className="flex items-center gap-2 bg-indigo-100 rounded-lg px-3 py-2 text-xs">
                    <span className="text-indigo-700 font-semibold">{ev.type}</span>
                    <span className="text-gray-500">{ev.date}</span>
                    {ev.memo && <span className="text-gray-600 flex-1 truncate">{ev.memo}</span>}
                    <button type="button" onClick={() => setNewEvents((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 追加フォーム */}
            {addingEvent ? (
              <div className="space-y-2 bg-white rounded-lg border border-indigo-200 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-indigo-800 mb-1">種別</label>
                    <select
                      className="w-full px-2 py-1.5 border border-indigo-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value)}
                    >
                      {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-indigo-800 mb-1">日付</label>
                    <input
                      type="date"
                      className="w-full px-2 py-1.5 border border-indigo-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-indigo-800 mb-1">メモ（任意）</label>
                  <input
                    className="w-full px-2 py-1.5 border border-indigo-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={newEventMemo}
                    onChange={(e) => setNewEventMemo(e.target.value)}
                    placeholder="例: 2回目面談 成約濃厚"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setAddingEvent(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">キャンセル</button>
                  <button type="button" onClick={addEvent} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700">追加</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingEvent(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                + 活動を追加
              </button>
            )}
          </div>
        )}

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
