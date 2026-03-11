'use client'
import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DealTable } from '@/components/deals/DealTable'
import { DealForm } from '@/components/deals/DealForm'
import { DEAL_STATUSES } from '@/types'
import { Plus, Search, Filter } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Member { id: number; name: string }

export default function DealsPage() {
  const [search, setSearch] = useState('')
  const [filterMember, setFilterMember] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Record<string, unknown> | null>(null)
  const [saving, setSaving] = useState(false)

  // クエリパラメータを組み立て
  const query = new URLSearchParams()
  if (filterMember) query.set('memberId', filterMember)
  if (filterStatus) query.set('status', filterStatus)
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

  const openCreate = () => { setEditTarget(null); setModalOpen(true) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEdit = (deal: any) => { setEditTarget(deal); setModalOpen(true) }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (formData: any) => {
    setSaving(true)
    try {
      const url = editTarget ? `/api/deals/${editTarget.id}` : '/api/deals'
      const method = editTarget ? 'PUT' : 'POST'
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      await mutate()
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/deals/${id}`, { method: 'DELETE' })
    await mutate()
  }

  return (
    <>
      <Header title="営業管理" subtitle="全案件の登録・編集・絞り込み" />

      <div className="p-6 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              {/* 検索・フィルター */}
              <div className="flex flex-wrap gap-2 flex-1">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-52 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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

              <Button onClick={openCreate}>
                <Plus size={16} />
                案件を追加
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <DealTable
              deals={deals ?? []}
              onEdit={openEdit}
              onDelete={handleDelete}
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
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>
    </>
  )
}
