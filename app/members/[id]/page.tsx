'use client'
import { use } from 'react'
import useSWR from 'swr'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DealStatusBadge } from '@/components/deals/DealStatusBadge'
import { formatCurrency, formatDate, getDueDateLabel } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: member } = useSWR(`/api/members/${id}`, fetcher)

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Header title={`${member.name} の詳細`} subtitle="担当案件一覧" />

      <div className="p-6 space-y-6">
        {/* 戻るリンク */}
        <Link href="/members" className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 w-fit">
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
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(member.deals ?? []).map((deal: any) => {
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
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-emerald-700">{formatCurrency(deal.paymentAmount as number)}</p>
                        <p className="text-xs text-gray-400">契約 {formatCurrency(deal.contractAmount as number)}</p>
                        {deal.dueDate && (
                          <p className={`text-xs mt-1 ${dueDateInfo?.color ?? 'text-gray-400'}`}>
                            {formatDate(deal.dueDate as string)}
                            {dueDateInfo && ` (${dueDateInfo.label})`}
                          </p>
                        )}
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
    </>
  )
}
