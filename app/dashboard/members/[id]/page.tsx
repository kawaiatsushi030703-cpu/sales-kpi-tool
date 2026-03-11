'use client'
import { use, useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DealStatusBadge } from '@/components/deals/DealStatusBadge'
import { formatCurrency, formatDate, getDueDateLabel } from '@/lib/utils'
import { ArrowLeft, Pencil } from 'lucide-react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: member, mutate } = useSWR(`/api/members/${id}`, fetcher)
  const [editDeal, setEditDeal] = useState<Record<string, unknown> | null>(null)
  const [newPayment, setNewPayment] = useState('')
  const [saving, setSaving] = useState(false)

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const openPaymentModal = (deal: Record<string, unknown>) => {
    setEditDeal(deal)
    setNewPayment(String(Math.round((deal.paymentAmount as number) / 10000)))
  }

  const handleSavePayment = async () => {
    if (!editDeal) return
    setSaving(true)
    try {
      const paymentAmount = Math.round(parseFloat(newPayment) * 10000) || 0
      await fetch(`/api/deals/${editDeal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editDeal, paymentAmount }),
      })
      await mutate()
      await globalMutate('/api/dashboard')
      await globalMutate('/api/members')
      setEditDeal(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Header title={`${member.name} の詳細`} subtitle="担当案件一覧" />

      <div className="p-6 space-y-6">
        <Link href="/dashboard/members" className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 w-fit">
          <ArrowLeft size={15} /> メンバー一覧に戻る
        </Link>

        {/* プロフィールカード */}
        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <Avatar name={member.name} color={member.avatarColor} size="lg" />
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
                  <p className="text-gray-500 text-sm">{member.email}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: '着金額', value: formatCurrency(member.paymentAmount), highlight: true },
                    { label: '目標額', value: formatCurrency(member.targetAmount) },
                    { label: '達成率', value: `${member.achievementRate}%`, highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className={`font-bold mt-1 ${highlight ? 'text-indigo-600 text-lg' : 'text-gray-700'}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <ProgressBar value={member.achievementRate} />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 案件一覧 */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800">担当案件 ({member.deals?.length ?? 0}件)</h2>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-100">
              {(member.deals ?? []).map((deal: Record<string, unknown>) => {
                const dueDateInfo = getDueDateLabel(deal.dueDate as string | null)
                return (
                  <div key={deal.id as number} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900">{deal.customerName as string}</p>
                          <DealStatusBadge status={deal.status as string} />
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{deal.productName as string}</p>
                        {deal.nextAction && (
                          <p className="text-xs text-indigo-600 mt-1">→ {deal.nextAction as string}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 flex items-start gap-3">
                        <div>
                          <p className="text-sm font-semibold text-emerald-700">{formatCurrency(deal.paymentAmount as number)}</p>
                          <p className="text-xs text-gray-400">契約 {formatCurrency(deal.contractAmount as number)}</p>
                          {deal.dueDate && (
                            <p className={`text-xs mt-1 ${dueDateInfo?.color ?? 'text-gray-400'}`}>
                              {formatDate(deal.dueDate as string)}
                              {dueDateInfo && ` (${dueDateInfo.label})`}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => openPaymentModal(deal)}
                          className="mt-0.5 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="着金を更新"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {(!member.deals || member.deals.length === 0) && (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">案件がありません</div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 着金更新モーダル */}
      <Modal isOpen={!!editDeal} onClose={() => setEditDeal(null)} title="着金を更新">
        {editDeal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">{editDeal.customerName as string}</p>
              <p className="text-xs text-gray-500 mt-0.5">{editDeal.productName as string}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">着金額（万円）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={newPayment}
                  onChange={(e) => setNewPayment(e.target.value)}
                  min={0}
                  step={0.1}
                  autoFocus
                />
                <span className="text-sm text-gray-500">万円</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                契約額: {formatCurrency(editDeal.contractAmount as number)}　現在の着金: {formatCurrency(editDeal.paymentAmount as number)}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setEditDeal(null)}>キャンセル</Button>
              <Button onClick={handleSavePayment} disabled={saving}>
                {saving ? '保存中...' : '保存する'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
