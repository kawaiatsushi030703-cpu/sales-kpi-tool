'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit2, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6']

interface MemberForm { name: string; targetAmount: number; avatarColor: string }

export default function MembersPage() {
  const { data: members, mutate } = useSWR('/api/members', fetcher)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<(MemberForm & { id?: number }) | null>(null)
  const [form, setForm] = useState<MemberForm>({ name: '', targetAmount: 0, avatarColor: '#ef4444' })
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setEditTarget(null)
    setForm({ name: '', targetAmount: 0, avatarColor: '#ef4444' })
    setModalOpen(true)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEdit = (m: any) => {
    setEditTarget(m as MemberForm & { id: number })
    setForm({ name: m.name as string, targetAmount: m.targetAmount as number, avatarColor: m.avatarColor as string })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editTarget?.id ? `/api/members/${editTarget.id}` : '/api/members'
      const method = editTarget?.id ? 'PUT' : 'POST'
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      await mutate()
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('このメンバーを削除しますか？関連する案件も削除されます。')) return
    await fetch(`/api/members/${id}`, { method: 'DELETE' })
    await mutate()
  }

  return (
    <>
      <Header title="メンバー管理" subtitle="メンバーの目標設定・進捗確認" />

      <div className="p-6">
        <div className="flex justify-end mb-4">
          <Button onClick={openCreate}><Plus size={16} />メンバーを追加</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(members ?? []).map((m: Record<string, unknown>) => (
            <Card key={m.id as number} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={m.name as string} color={m.avatarColor as string} size="lg" />
                  <div>
                    <p className="font-semibold text-gray-900">{m.name as string}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(m)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(m.id as number)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">着金進捗</span>
                  <span className="font-bold text-gray-700">{m.achievementRate as number}%</span>
                </div>
                <ProgressBar value={m.achievementRate as number} />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatCurrency(m.paymentAmount as number)}</span>
                  <span>目標 {formatCurrency(m.targetAmount as number)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span className="text-sm text-gray-500">担当案件: <span className="font-semibold text-gray-700">{m.dealCount as number}件</span></span>
                <Link
                  href={`/members/${m.id}`}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  詳細を見る <ArrowRight size={13} />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget?.id ? 'メンバーを編集' : 'メンバーを追加'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前 *</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">月間目標着金額 (円)</label>
            <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.targetAmount} onChange={(e) => setForm(p => ({ ...p, targetAmount: parseInt(e.target.value) || 0 }))} min={0} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">アバターカラー</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setForm(p => ({ ...p, avatarColor: c }))}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${form.avatarColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>キャンセル</Button>
            <Button type="submit" disabled={saving}>{saving ? '保存中...' : '保存する'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
