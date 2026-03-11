'use client'
import { useState, useCallback } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DealTable } from '@/components/deals/DealTable'
import { DealForm } from '@/components/deals/DealForm'
import { DEAL_STATUSES } from '@/types'
import { Plus, Search, MessageSquare, Sheet } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Member { id: number; name: string }

// LINEメッセージを解析してフォームデータに変換
function parseLineMessage(text: string): Record<string, unknown> {
  // 複数行にまたがる値も取得できるよう改行まで取得
  const get = (key: string) => {
    const match = text.match(new RegExp(`${key}[：:][ 　]*(.*)`))
    return match ? match[1].trim() : ''
  }

  const customerName = get('LINE名').replace(/[\s　]+/g, ' ').trim()
  const dosen = get('導線')
  const seiyakuResult = get('成約結果')
  const recording = get('録画')
  const customer = get('客層')
  const dateStr = get('日時')

  // 面談日（日時フィールドから日付を抽出）
  let meetingDate = ''
  const meetingMatch = dateStr.match(/(\d{1,2})[\/月](\d{1,2})/)
  if (meetingMatch) {
    const now = new Date()
    const m = parseInt(meetingMatch[1])
    const d = parseInt(meetingMatch[2])
    const y = m > now.getMonth() + 1 ? now.getFullYear() - 1 : now.getFullYear()
    meetingDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  // カテゴリ判定
  const category = dosen.includes('AI') ? 'AI' : '物販'

  // 商品名（導線から「Cチーム AI/物販 」以降）
  const productName = dosen.replace(/^Cチーム[\s　]*(AI|物販)?[\s　]*/, '').trim() || dosen

  // ステータス判定（優先度順）
  let status = '後追い'
  const r = seiyakuResult
  if (/一部決済|一部入金/.test(r))                                        status = '一部決済'
  else if (/未成約|不成約|キャンセル|断り|見送り|不在|繋がらない|音信不通/.test(r))  status = '未成約'
  else if (/決済待ち|支払い待ち|入金待ち|振込待ち/.test(r))               status = '決済待ち'
  else if (/成約|即決/.test(r) && !/未成約|不成約/.test(r))               status = '成約'
  else if (/二回目|2回目|遷移|再面談|面談|商談|次回|改めて|予定/.test(r))  status = '二回目遷移'

  // 次回アクション（成約結果から要点を抽出）
  const nextAction = seiyakuResult

  // 期日（成約結果から日付を抽出 例: 3/16, 3月16日）
  let dueDate = ''
  const now = new Date()
  const dueDateMatch = r.match(/(\d{1,2})[\/月](\d{1,2})/)
  if (dueDateMatch) {
    const m = parseInt(dueDateMatch[1])
    const d = parseInt(dueDateMatch[2])
    const y = m < now.getMonth() + 1 ? now.getFullYear() + 1 : now.getFullYear()
    dueDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  // 備考（日時＋客層＋録画URL）
  const notes = [
    dateStr    && `日時: ${dateStr}`,
    customer   && `客層: ${customer}`,
    recording  && `録画: ${recording}`,
  ].filter(Boolean).join('\n')

  return { customerName, productName, category, status, nextAction, meetingDate, dueDate, notes, contractAmount: 0, paymentAmount: 0 }
}

export default function DealsPage() {
  const [search, setSearch] = useState('')
  const [filterMember, setFilterMember] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Record<string, unknown> | null>(null)
  const [saving, setSaving] = useState(false)
  const [lineModalOpen, setLineModalOpen] = useState(false)
  const [lineText, setLineText] = useState('')
  const [lineError, setLineError] = useState('')
  const [lineInitial, setLineInitial] = useState<Record<string, unknown> | null>(null)
  const [sheetsModalOpen, setSheetsModalOpen] = useState(false)
  const [sheetsUrl, setSheetsUrl] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('sheetsUrl') ?? '' : '')
  const [sheetsLoading, setSheetsLoading] = useState(false)
  const [sheetsResult, setSheetsResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [sheetsError, setSheetsError] = useState('')

  // クエリパラメータを組み立て
  const query = new URLSearchParams()
  if (filterMember) query.set('memberId', filterMember)
  if (filterStatus) query.set('status', filterStatus)
  if (filterCategory) query.set('category', filterCategory)
  if (filterTeam) query.set('teamColor', filterTeam)
  if (search) query.set('search', search)
  query.set('sortBy', sortBy)
  query.set('order', order)

  const { data: deals, mutate } = useSWR(`/api/deals?${query}`, fetcher)
  const { data: members } = useSWR<Member[]>('/api/members', fetcher)

  const handleSort = useCallback((col: string) => {
    if (col === sortBy) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setOrder('asc')
    }
  }, [sortBy])

  const openCreate = () => { setLineInitial(null); setEditTarget(null); setModalOpen(true) }

  const handleLineParse = () => {
    if (!lineText.trim()) { setLineError('メッセージを貼り付けてください'); return }
    if (!lineText.includes('LINE名')) { setLineError('「LINE名：」が見つかりません。正しい形式か確認してください'); return }
    const parsed = parseLineMessage(lineText)
    setLineError('')
    setLineModalOpen(false)
    setLineText('')
    setLineInitial(parsed)
    setEditTarget(null)
    setModalOpen(true)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEdit = (deal: any) => { setLineInitial(null); setEditTarget(deal); setModalOpen(true) }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (formData: any) => {
    setSaving(true)
    try {
      const url = editTarget ? `/api/deals/${editTarget.id}` : '/api/deals'
      const method = editTarget ? 'PUT' : 'POST'
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      await mutate()
      await globalMutate('/api/dashboard')
      await globalMutate('/api/members')
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryToggle = async (id: number, newCategory: string) => {
    const deal = deals?.find((d: Record<string, unknown>) => d.id === id)
    if (!deal) return
    await fetch(`/api/deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...deal, category: newCategory }),
    })
    await mutate()
    await globalMutate('/api/dashboard')
    await globalMutate('/api/members')
  }

  const handleSheetsSync = async () => {
    if (!sheetsUrl.trim()) { setSheetsError('URLを入力してください'); return }
    setSheetsLoading(true)
    setSheetsResult(null)
    setSheetsError('')
    localStorage.setItem('sheetsUrl', sheetsUrl)
    try {
      const res = await fetch('/api/import/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheetsUrl }),
      })
      const data = await res.json()
      if (!res.ok) { setSheetsError(data.error ?? 'エラーが発生しました'); return }
      setSheetsResult(data)
      await mutate()
      await globalMutate('/api/dashboard')
      await globalMutate('/api/members')
    } catch (e) {
      setSheetsError(String(e))
    } finally {
      setSheetsLoading(false)
    }
  }

  const handleQuickUpdate = async (id: number, contractAmount: number, paymentAmount: number) => {
    const deal = deals?.find((d: Record<string, unknown>) => d.id === id)
    if (!deal) return
    await fetch(`/api/deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...deal, contractAmount, paymentAmount }),
    })
    await mutate()
    await globalMutate('/api/dashboard')
    await globalMutate('/api/members')
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/deals/${id}`, { method: 'DELETE' })
    await mutate()
    await globalMutate('/api/dashboard')
    await globalMutate('/api/members')
  }

  return (
    <>
      <Header title="営業管理" subtitle="全案件の登録・編集・絞り込み" />

      <div className="p-3 md:p-6 space-y-4">
        <Card>
          {/* 物販/AIタブ */}
          <div className="flex border-b border-gray-200">
            {[
              { value: '', label: '全て' },
              { value: '物販', label: '物販' },
              { value: 'AI', label: 'AI' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterCategory(value)}
                className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  filterCategory === value
                    ? value === 'AI'
                      ? 'border-cyan-500 text-cyan-600'
                      : value === '物販'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* チームタブ */}
          <div className="flex gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50/50">
            {[
              { value: '', label: '全チーム', bg: 'bg-gray-200', active: 'bg-gray-600 text-white' },
              { value: '#3b82f6', label: '青チーム', bg: 'bg-blue-100 text-blue-700', active: 'bg-blue-500 text-white' },
              { value: '#f59e0b', label: '黄チーム', bg: 'bg-amber-100 text-amber-700', active: 'bg-amber-500 text-white' },
              { value: '#ef4444', label: '赤チーム', bg: 'bg-red-100 text-red-700', active: 'bg-red-500 text-white' },
            ].map(({ value, label, bg, active }) => (
              <button
                key={value}
                onClick={() => setFilterTeam(value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filterTeam === value ? active : bg}`}
              >
                {label}
              </button>
            ))}
          </div>

          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              {/* 検索・フィルター */}
              <div className="flex flex-wrap gap-2 flex-1">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-52 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="顧客名・商品名で検索"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={filterMember}
                  onChange={(e) => setFilterMember(e.target.value)}
                >
                  <option value="">全メンバー</option>
                  {members?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>

                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">全ステータス</option>
                  {DEAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={() => { setSheetsResult(null); setSheetsError(''); setSheetsModalOpen(true) }}>
                  <Sheet size={16} />
                  スプシ同期
                </Button>
                <Button variant="secondary" onClick={() => { setLineText(''); setLineError(''); setLineModalOpen(true) }}>
                  <MessageSquare size={16} />
                  LINEから入力
                </Button>
                <Button onClick={openCreate}>
                  <Plus size={16} />
                  案件を追加
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <DealTable
              deals={deals ?? []}
              onEdit={openEdit}
              onDelete={handleDelete}
              onQuickUpdate={handleQuickUpdate}
              onCategoryToggle={handleCategoryToggle}
              sortBy={sortBy}
              order={order}
              onSort={handleSort}
            />
            {deals && (
              <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
                {deals.length}件
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* LINEペーストモーダル */}
      <Modal isOpen={lineModalOpen} onClose={() => setLineModalOpen(false)} title="LINEメッセージから入力">
        <div className="space-y-3">
          <p className="text-sm text-gray-500">【報告】形式のLINEメッセージをそのまま貼り付けてください</p>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
            rows={10}
            placeholder={"【報告】\n日時：3/10 10:30\n導線：Cチーム AI UTAGE集客(広告)\nLINE名：山田 太郎\n成約結果：...\n録画：https://...\n客層：..."}
            value={lineText}
            onChange={(e) => { setLineText(e.target.value); setLineError('') }}
            autoFocus
          />
          {lineError && <p className="text-sm text-red-500">{lineError}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setLineModalOpen(false)}>キャンセル</Button>
            <Button onClick={handleLineParse}>解析してフォームに入力</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? '案件を編集' : '案件を追加'}
        size="lg"
      >
        <DealForm
          initial={editTarget ? {
            ...editTarget,
            dueDate: editTarget.dueDate as string,
          } : lineInitial ? {
            ...lineInitial,
            dueDate: lineInitial.dueDate as string,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>
    </>
  )
}
